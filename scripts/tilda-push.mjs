// ─────────────────────────────────────────────────────────────
// tilda-push.mjs (Sprint 15, Ф1.2) — заливка репозитория в Tilda одним прогоном.
//
// У Tilda нет write-API (только чтение и только на Business), поэтому это
// роботизированный клик поверх ОДНОЙ сохранённой сессии (см. tilda-session.mjs):
// один вход на весь прогон, паузы 1,5–3 с между действиями — именно гонка
// запросов и логин на каждый скрипт приводили к reCAPTCHA в Sprint 14.
//
// Для каждой страницы:
//   1) содержимое блока T123 ← out/containers/<container>.html  (prerender для робота)
//   2) SEO-поля ← seo/pages.json (источник истины в git, не поля админки)
//   3) публикация страницы
//
// Запуск:  npm run push            — все страницы
//          npm run push -- home    — точечно  (или PAGES=home,catalog)
// Флаги:   SKIP_CONTAINERS=1 / SKIP_META=1 — залить только одну из частей
// ─────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { withSession, pace, publishPage, PROJECTID } from './tilda-session.mjs';

const cfg = JSON.parse(readFileSync('seo/pages.json', 'utf-8')).pages;
const argPages = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const only = (process.env.PAGES || argPages.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const names = only.length ? only : Object.keys(cfg);
const SKIP_CONTAINERS = process.env.SKIP_CONTAINERS === '1';
const SKIP_META = process.env.SKIP_META === '1';

const bad = names.filter((n) => !cfg[n]);
if (bad.length) { console.error(`  неизвестные страницы: ${bad.join(', ')}`); process.exit(2); }

const results = [];

await withSession(async ({ page }) => {
  for (const name of names) {
    const p = cfg[name];
    console.log(`\n  ── ${name}  (pageId ${p.pageId}, ${p.alias})`);
    const r = { name, container: null, meta: null, publish: null };

    await page.goto(`https://tilda.ru/page/?pageid=${p.pageId}&projectid=${PROJECTID}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(5000);

    // ── 1. контейнер T123 ──
    const file = `out/containers/${p.container}.html`;
    if (!SKIP_CONTAINERS && p.recordId) {
      if (!existsSync(file)) {
        console.log(`     ! нет ${file} — сначала npm run build && node scripts/gen-seo-containers.mjs`);
        r.container = 'нет файла';
      } else {
        const html = readFileSync(file, 'utf-8');
        const res = await page.evaluate(async ({ pageid, recordid, html, PROJECTID }) => {
          const body = new URLSearchParams({
            comm: 'saverecord', pageid, recordid, projectid: PROJECTID,
            code: html, commfileexist: '',
          });
          const resp = await fetch('/page/submit/', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: body.toString(),
          });
          return { status: resp.status, body: (await resp.text()).slice(0, 40) };
        }, { pageid: String(p.pageId), recordid: String(p.recordId), html, PROJECTID });
        r.container = `${res.status} ${res.body.trim()} · ${Math.round(html.length / 1024)}KB`;
        console.log(`     контейнер: ${r.container}`);
        await pace();
      }
    }

    // ── 2. SEO-поля (форма #formpageedit, comm=savepagesettings) ──
    if (!SKIP_META) {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('a,button,div')]
          .find((e) => /^настройки страницы$/i.test((e.innerText || '').trim()));
        el && el.click();
      });
      await page.waitForTimeout(5000);
      const res = await page.evaluate(async (p) => {
        const f = document.querySelector('#formpageedit');
        if (!f) return { err: 'форма #formpageedit не найдена' };
        const set = (n, v) => {
          const el = f.querySelector(`[name="${n}"]`);
          if (!el || v == null) return false;
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        };
        set('title', p.title);            // → og:title (тут жил «Blank page»)
        set('descr', p.description);
        set('meta_title', p.metaTitle);
        set('meta_descr', p.metaDescr);
        set('link_canonical', p.canonical); // пусто → Tilda сгенерит http://
        set('fb_title', p.metaTitle);
        set('fb_descr', p.metaDescr);
        set('imgfile', p.ogImage);
        set('fb_imgfile', p.ogImage);
        // отправляем форму ЦЕЛИКОМ — прочие ~44 поля сохраняются как есть
        const body = new URLSearchParams();
        for (const [k, v] of new FormData(f).entries()) if (typeof v === 'string') body.append(k, v);
        const resp = await fetch(f.action, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: body.toString(),
        });
        return { status: resp.status };
      }, p);
      r.meta = res.err || `${res.status}`;
      console.log(`     мета: ${r.meta}`);
      await pace();
    }

    // ── 3. публикация ──
    r.publish = await publishPage(page, p.pageId);
    console.log(`     publish: ${r.publish}`);
    results.push(r);
    await pace(2000, 3000);
  }
});

console.log('\n  Итог заливки:');
for (const r of results) {
  console.log(`   ${r.name.padEnd(11)} контейнер=${r.container ?? '—'}  мета=${r.meta ?? '—'}  publish=${r.publish}`);
}
const failed = results.filter((r) => r.publish !== 200 || (r.meta && r.meta !== '200') || /нет файла/.test(String(r.container)));
if (failed.length) { console.log(`\n  ПРОВАЛ на: ${failed.map((f) => f.name).join(', ')}\n`); process.exit(1); }
console.log('\n  Всё залито и опубликовано. Дальше — verify-live по домену.\n');
