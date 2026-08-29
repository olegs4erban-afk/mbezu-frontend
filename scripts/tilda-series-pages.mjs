// ─────────────────────────────────────────────────────────────
// tilda-series-pages.mjs — создание посадочных серий /catalog/<slug> (Sprint 15).
//
// Механика: у Tilda нет создания страниц по API → дублируем донора
// (legal 142950726 — на нём один T123-блок) функцией страницы
// td__pagesettings__dublicatePage, затем в каждую копию:
//   1) saverecord — контейнер серии из out/containers/catalog-<slug>.html;
//   2) savepagesettings через #formpageedit (title/descr/alias/meta/canonical);
//   3) publish.
// Мета берётся из prerendered dist/catalog/<slug>/index.html (истина сборки).
//
//   node scripts/tilda-series-pages.mjs           — только дубль+запись+мета+publish
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const DONOR = '142950726';
const SERIES = [
  { slug: 'monohromnaya' },
  { slug: 'ulitsy-mira' },
  { slug: 'tihaya-sila' },
  { slug: 'tondo' },
];
const KNOWN = new Set(['140814006', '142947296', '142948046', '142948406', '142949736',
  '142949956', '142950276', '142950726', '143102566', '143103886', '143107666']);

const metaFromDist = (slug) => {
  const h = readFileSync(`dist/catalog/${slug}/index.html`, 'utf8');
  const one = (re) => (h.match(re) || [])[1] || '';
  return {
    metaTitle: one(/<title[^>]*>([^<]*)<\/title>/),
    metaDescr: one(/<meta name="description" content="([^"]*)"/),
    canonical: one(/<link rel="canonical" href="([^"]*)"/),
  };
};

await withSession(async ({ page }) => {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  // сколько копий уже есть (идемпотентность прогона)
  const listPages = () => page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/page/?pageid="]')]
      .map((a) => (a.getAttribute('href').match(/pageid=(\d+)/) || [])[1]).filter(Boolean));
  let before = [...new Set(await listPages())];
  const need = SERIES.length - before.filter((id) => !KNOWN.has(id)).length;
  console.log(`страниц сейчас: ${before.length}; новых копий нужно: ${need}`);

  for (let i = 0; i < need; i++) {
    await page.evaluate((id) => window.td__pagesettings__dublicatePage(id), DONOR);
    await page.waitForTimeout(6000);
    // после дубля Tilda может перерисовать список
    console.log(`  копия ${i + 1}/${need} создана`);
    await pace(1500, 2500);
  }
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const all = [...new Set(await listPages())];
  const fresh = all.filter((id) => !KNOWN.has(id)).sort();
  console.log('новые pageid:', fresh.join(', '));
  if (fresh.length < SERIES.length) throw new Error(`копий ${fresh.length}, нужно ${SERIES.length}`);

  for (let i = 0; i < SERIES.length; i++) {
    const s = SERIES[i];
    const pid = fresh[i];
    const html = readFileSync(`out/containers/catalog-${s.slug}.html`, 'utf8');
    const meta = metaFromDist(s.slug);
    console.log(`\n▸ ${s.slug} → страница ${pid}`);

    // 1. recordid T123 в копии
    const rec = await page.evaluate(async ({ pid, PROJECTID }) => {
      const r = await fetch('/page/get/getpage/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ pageid: pid, projectid: PROJECTID }).toString(),
      });
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch { return { err: 'не JSON: ' + t.slice(0, 80) }; }
      const recs = j.records || j.data || [];
      // T123 = tplid 131; recordid лежит в html записи атрибутом recordid="…"
      const t123 = recs.find((x) => String(x.tplid) === '131' || /t123__/.test(String(x.css || '')));
      if (!t123) return { err: 'T123 не найден среди ' + recs.length + ' записей', types: recs.map((x) => x.tplid).join(',') };
      const m = String(t123.html || '').match(/recordid="([0-9]+)"/);
      return m ? { id: m[1] } : { err: 'recordid не извлечён из html' };
    }, { pid, PROJECTID });
    if (rec.err) { console.log('  ✗', rec.err, rec.types || ''); continue; }
    console.log('  T123 recordid:', rec.id);

    // 2. контейнер
    const wr = await page.evaluate(async ({ pid, rid, html, PROJECTID }) => {
      const r = await fetch('/page/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ comm: 'saverecord', pageid: pid, recordid: rid, projectid: PROJECTID, code: html, commfileexist: '' }).toString(),
      });
      return { status: r.status, body: (await r.text()).slice(0, 40).trim() };
    }, { pid, rid: rec.id, html, PROJECTID });
    console.log('  saverecord:', JSON.stringify(wr));

    // 3. мета через попап настроек
    await page.evaluate((id) => window.td__showform__EditPageSettings(id), pid);
    await page.waitForTimeout(3500);
    const mr = await page.evaluate(async (vals) => {
      const f = document.querySelector('#formpageedit');
      if (!f) return { err: 'нет #formpageedit' };
      for (const [n, v] of Object.entries(vals)) {
        const el = f.querySelector(`[name="${n}"]`);
        if (!el || v == null) continue;
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const body = new URLSearchParams();
      for (const [k, v] of new FormData(f).entries()) if (typeof v === 'string') body.append(k, v);
      const r = await fetch('/projects/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
      });
      return { status: r.status, alias: (f.querySelector('[name="alias"]') || {}).value };
    }, {
      title: meta.metaTitle,
      descr: meta.metaDescr.slice(0, 140),
      alias: `catalog/${s.slug}`,
      meta_title: meta.metaTitle,
      meta_descr: meta.metaDescr,
      link_canonical: meta.canonical,
      fb_title: meta.metaTitle,
      fb_descr: meta.metaDescr,
      imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg',
      fb_imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg',
    });
    console.log('  мета:', JSON.stringify(mr));
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('a,button')].find((e) => /Закрыть/.test(e.innerText || ''));
      b && b.click();
    });
    await pace(800, 1500);

    // 4. публикация
    const pub = await publishPage(page, pid).catch((e) => String(e).slice(0, 50));
    console.log('  publish:', pub);
    await pace(1500, 2500);
  }
});
