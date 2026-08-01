// ─────────────────────────────────────────────────────────────
// tilda-push.mjs (Sprint 15, Ф1.2 + v2 §1.1) — заливка репозитория в Tilda.
//
// У Tilda нет write-API, поэтому это роботизированный клик поверх ОДНОЙ сохранённой
// сессии (tilda-session.mjs): один вход на прогон, паузы 1,5–3 с между действиями.
// Режим ВИДИМЫЙ — headless Tilda не пускает (проверено, см. PROGRESS.md).
//
// Транзакционность (v2 §1.1.3): CDN к моменту заливки уже обновлён, поэтому
// «залили половину страниц и упали» = у робота новый бандл при старом prerendered
// HTML. Чтобы этого не было:
//   1) СНАЧАЛА снимаем снапшот блока и мета КАЖДОЙ страницы (backup/tilda-snapshot/<ts>/)
//   2) заливаем по одной, после каждой — проверка, что содержимое реально записалось
//   3) любая ошибка → откат ВСЕХ уже изменённых страниц из снапшота + публикация
// Идемпотентность: если содержимое блока уже совпадает с целевым — страница пропускается.
//
// Запуск:  npm run push            — все страницы
//          npm run push -- home    — точечно  (или PAGES=home,catalog)
// Флаги:   SKIP_CONTAINERS=1 / SKIP_META=1 · NO_ROLLBACK=1 (диагностика, откат выключен)
// ─────────────────────────────────────────────────────────────
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withSession, pace, publishPage, PROJECTID } from './tilda-session.mjs';

const cfg = JSON.parse(readFileSync('seo/pages.json', 'utf-8')).pages;
const argPages = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const only = (process.env.PAGES || argPages.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const names = only.length ? only : Object.keys(cfg);
const SKIP_CONTAINERS = process.env.SKIP_CONTAINERS === '1';
const SKIP_META = process.env.SKIP_META === '1';
const NO_ROLLBACK = process.env.NO_ROLLBACK === '1';

const bad = names.filter((n) => !cfg[n]);
if (bad.length) { console.error(`  неизвестные страницы: ${bad.join(', ')}`); process.exit(2); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SNAPDIR = join('backup', 'tilda-snapshot', stamp);
mkdirSync(SNAPDIR, { recursive: true });

const openEditor = async (page, pageId) => {
  await page.goto(`https://tilda.ru/page/?pageid=${pageId}&projectid=${PROJECTID}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4500);
};

/**
 * Текущий HTML блока T123. Способ проверенный (tilda_swap.mjs, Sprint 5):
 * открыть редактор записи функцией самой Tilda и прочитать textarea[name="code"].
 * (Эндпоинта /page/editrecord/ у Tilda нет — попытка читать так давала пустоту.)
 */
const readContainer = (page, pageId, recordId) => page.evaluate(async (rid) => {
  try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch { /* редактор ещё не поднялся */ }
  for (let i = 0; i < 80; i++) {
    const t = document.querySelector('textarea[name="code"]');
    if (t && t.value && t.value.length > 30) return t.value;
    await new Promise((r) => setTimeout(r, 250));
  }
  const t = document.querySelector('textarea[name="code"]');
  return t ? t.value : null;
}, String(recordId));

const writeContainer = (page, pageId, recordId, html) => page.evaluate(async ({ pageId, recordId, html, PROJECTID }) => {
  const r = await fetch('/page/submit/', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams({ comm: 'saverecord', pageid: pageId, recordid: recordId, projectid: PROJECTID, code: html, commfileexist: '' }).toString(),
  });
  return { status: r.status, body: (await r.text()).slice(0, 30).trim() };
}, { pageId: String(pageId), recordId: String(recordId), html, PROJECTID });

/** Текущие SEO-поля страницы (для снапшота) + запись новых. */
/**
 * Открыть «Настройки страницы» и ДОЖДАТЬСЯ формы, а не спать фиксированно:
 * модалка поднимается неравномерно, из-за чего перечитывание меты видело пустоту
 * и проверка ложно падала («title=undefined»).
 */
const openSettings = async (page, tries = 3) => {
  for (let t = 0; t < tries; t++) {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('a,button,div')]
        .find((e) => /^настройки страницы$/i.test((e.innerText || '').trim()));
      el && el.click();
    });
    try {
      await page.waitForFunction(() => {
        const f = document.querySelector('#formpageedit');
        return !!(f && f.querySelector('[name="title"]'));
      }, { timeout: 15000 });
      await page.waitForTimeout(800); // дать полям догрузиться значениями
      return true;
    } catch { await page.waitForTimeout(2000); }
  }
  return false;
};
const FIELDS = ['title', 'descr', 'meta_title', 'meta_descr', 'link_canonical', 'fb_title', 'fb_descr', 'imgfile', 'fb_imgfile'];
const readMeta = (page) => page.evaluate((FIELDS) => {
  const f = document.querySelector('#formpageedit');
  if (!f) return null;
  const o = {};
  for (const n of FIELDS) o[n] = (f.querySelector(`[name="${n}"]`) || {}).value ?? null;
  return o;
}, FIELDS);
const writeMeta = (page, values) => page.evaluate(async (values) => {
  const f = document.querySelector('#formpageedit');
  if (!f) return { err: 'форма #formpageedit не найдена' };
  for (const [n, v] of Object.entries(values)) {
    const el = f.querySelector(`[name="${n}"]`);
    if (!el || v == null) continue;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const body = new URLSearchParams();
  for (const [k, v] of new FormData(f).entries()) if (typeof v === 'string') body.append(k, v);
  // Эндпоинт подсмотрен у самой Tilda (кнопка «Сохранить изменения», js-ps-popup-submit):
  // это /projects/submit/ с comm=savepagesettings. Ни f.action (возвращает HTML и НЕ сохраняет),
  // ни /page/submit/ (отвечает {"error":"Wrong command"}) не подходят.
  const r = await fetch('/projects/submit/', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  return { status: r.status, body: (await r.text()).slice(0, 80).replace(/\s+/g, ' ') };
}, values);

const metaFor = (p) => ({
  title: p.title, descr: p.description, meta_title: p.metaTitle, meta_descr: p.metaDescr,
  link_canonical: p.canonical, fb_title: p.metaTitle, fb_descr: p.metaDescr,
  imgfile: p.ogImage, fb_imgfile: p.ogImage,
});

const done = [];      // страницы, которые успели изменить (для отката)
const results = [];

await withSession(async ({ page }) => {
  // ── ФАЗА 1: снапшот ВСЕГО, что будем трогать, до первой записи ──
  console.log(`\n  Снапшот → ${SNAPDIR}`);
  const snaps = {};
  for (const name of names) {
    const p = cfg[name];
    await openEditor(page, p.pageId);
    const snap = { name, pageId: p.pageId, recordId: p.recordId, container: null, meta: null };
    if (!SKIP_CONTAINERS && p.recordId) snap.container = await readContainer(page, p.pageId, p.recordId);
    if (!SKIP_META) { await openSettings(page); snap.meta = await readMeta(page); }
    snaps[name] = snap;
    writeFileSync(join(SNAPDIR, `${name}.json`), JSON.stringify(snap, null, 1), 'utf-8');
    console.log(`   ✓ ${name.padEnd(11)} блок=${snap.container ? Math.round(snap.container.length / 1024) + 'KB' : '—'} мета=${snap.meta ? 'снята' : '—'}`);
    await pace();
  }

  // ── ФАЗА 2: заливка по одной с проверкой ──
  for (const name of names) {
    const p = cfg[name];
    const snap = snaps[name];
    console.log(`\n  ── ${name} (pageId ${p.pageId}, ${p.alias})`);
    const r = { name, container: '—', meta: '—', publish: null };
    try {
      await openEditor(page, p.pageId);

      if (!SKIP_CONTAINERS && p.recordId) {
        const file = `out/containers/${p.container}.html`;
        if (!existsSync(file)) throw new Error(`нет ${file} — сначала npm run build && npm run containers:seo`);
        const html = readFileSync(file, 'utf-8');
        if (snap.container != null && snap.container.trim() === html.trim()) {
          r.container = 'уже актуален (пропуск)';
        } else {
          // В список отката — ДО записи: если запись прошла, а сверка упала,
          // страница уже изменена и обязана попасть в откат.
          if (!done.includes(name)) done.push(name);
          const res = await writeContainer(page, p.pageId, p.recordId, html);
          if (res.status !== 200) throw new Error(`saverecord → ${res.status}`);
          await pace();
          // ФАКТ, а не отсутствие ошибки: перечитываем и сверяем
          const now = await readContainer(page, p.pageId, p.recordId);
          if (now == null || now.trim() !== html.trim()) {
            throw new Error(`содержимое блока не совпало после записи (записано ${now ? now.length : 0} из ${html.length})`);
          }
          r.container = `записан и сверен · ${Math.round(html.length / 1024)}KB`;
        }
      }

      if (!SKIP_META) {
        await openSettings(page);
        const target = metaFor(p);
        const cur = await readMeta(page);
        const same = cur && Object.entries(target).every(([k, v]) => (cur[k] || '') === (v || ''));
        if (same) {
          r.meta = 'уже актуальна (пропуск)';
        } else {
          if (!done.includes(name)) done.push(name); // тоже до записи
          const res = await writeMeta(page, target);
          if (res.err || res.status !== 200) throw new Error(`savepagesettings → ${res.err || res.status}`);
          await pace();
          await openEditor(page, p.pageId);
          await openSettings(page);
          const after = await readMeta(page);
          const okMeta = after && ['title', 'meta_title', 'meta_descr', 'link_canonical'].every((k) => (after[k] || '') === (target[k] || ''));
          if (!okMeta) throw new Error(`мета не совпала после записи (title=«${after?.title}»)`);
          r.meta = 'записана и сверена';
        }
      }

      r.publish = await publishPage(page, p.pageId);
      if (r.publish !== 200) throw new Error(`publish → ${r.publish}`);
      console.log(`     контейнер: ${r.container}\n     мета: ${r.meta}\n     publish: ${r.publish}`);
      results.push(r);
      await pace(2000, 3000);
    } catch (e) {
      console.error(`\n  ✗ ОШИБКА на «${name}»: ${e.message}`);
      if (NO_ROLLBACK) { console.error('  NO_ROLLBACK=1 — откат отключён, состояние промежуточное!'); throw e; }
      await rollback(page, snaps);
      throw e;
    }
  }
});

async function rollback(page, snaps) {
  if (!done.length) { console.error('  Откат не нужен: ни одна страница не изменена.'); return; }
  console.error(`\n  ОТКАТ ${done.length} страниц(ы) из снапшота ${SNAPDIR}:`);
  for (const name of done) {
    const s = snaps[name];
    try {
      await openEditor(page, s.pageId);
      if (s.container != null) await writeContainer(page, s.pageId, s.recordId, s.container);
      await pace();
      if (s.meta) { await openSettings(page); await writeMeta(page, s.meta); await pace(); }
      const st = await publishPage(page, s.pageId);
      console.error(`   ↩ ${name} восстановлена, publish=${st}`);
    } catch (e) {
      console.error(`   ✗ ${name} НЕ восстановлена: ${e.message}. Снапшот: ${join(SNAPDIR, name + '.json')}`);
    }
  }
}

console.log('\n  Итог заливки:');
for (const r of results) console.log(`   ${r.name.padEnd(11)} контейнер=${r.container} · мета=${r.meta} · publish=${r.publish}`);
console.log(`\n  Снапшот для отката: ${SNAPDIR}\n`);
