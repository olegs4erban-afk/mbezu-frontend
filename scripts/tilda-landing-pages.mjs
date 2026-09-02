// ─────────────────────────────────────────────────────────────
// tilda-landing-pages.mjs (аудит r2) — создание/обновление статичных T123-страниц из content/*.html
// по манифесту seo/landings.json: [{ file, alias, title, descr, canonical, og }].
// Механика как у серий: дубль донора (legal 142950726 — один T123) → saverecord → мета (/projects/)
// → publish. Идемпотентно: если alias уже есть (Export API getpageslist) — только перезапись и мета.
//   node scripts/tilda-landing-pages.mjs            — все из манифеста
//   node scripts/tilda-landing-pages.mjs podarok    — точечно по alias
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const DONOR = '142950726';
const manifest = JSON.parse(readFileSync('seo/landings.json', 'utf8'));
const only = process.argv.slice(2);
const items = only.length ? manifest.filter((m) => only.includes(m.alias)) : manifest;
const api = JSON.parse(readFileSync('.secrets/tilda-api.json', 'utf8'));

async function pagesByAlias() {
  const r = await fetch(`https://api.tildacdn.info/v1/getpageslist/?publickey=${api.publickey}&secretkey=${api.secretkey}&projectid=${api.projectid}`);
  const j = await r.json();
  const map = {};
  for (const p of j.result || []) if (p.alias) map[p.alias] = String(p.id);
  return map;
}

await withSession(async ({ page }) => {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  let byAlias = await pagesByAlias();
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  const listPages = () => page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/page/?pageid="]')].map((a) => (a.getAttribute('href').match(/pageid=(\d+)/) || [])[1]).filter(Boolean));

  for (const m of items) {
    let pid = m.pageid || byAlias[m.alias];
    console.log(`\n▸ ${m.alias} — ${pid ? 'страница есть ' + pid : 'создаём'}`);
    if (!pid) {
      const before = new Set(await listPages());
      await page.evaluate((id) => window.td__pagesettings__dublicatePage(id), DONOR);
      await page.waitForTimeout(7000);
      await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(6000);
      const after = (await listPages()).filter((id) => !before.has(id));
      pid = after.sort().pop();
      if (!pid) { console.log('  ✗ копия не найдена'); continue; }
      console.log('  новая страница:', pid);
    }
    // recordid T123
    const rec = await page.evaluate(async ({ pid, PROJECTID }) => {
      const r = await fetch('/page/get/getpage/', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ pageid: pid, projectid: PROJECTID }).toString() });
      const j = await r.json().catch(() => null);
      const recs = (j && (j.records || j.data)) || [];
      const t = recs.find((x) => String(x.tplid) === '131');
      return t ? (String(t.html || '').match(/recordid="([0-9]+)"/) || [])[1] : null;
    }, { pid, PROJECTID });
    if (!rec) { console.log('  ✗ T123 не найден'); continue; }
    const html = readFileSync(m.file, 'utf8');
    const wr = await page.evaluate(async ({ pid, rec, html, PROJECTID }) => {
      const r = await fetch('/page/submit/', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ comm: 'saverecord', pageid: pid, recordid: rec, projectid: PROJECTID, code: html, commfileexist: '' }).toString() });
      return { status: r.status, body: (await r.text()).slice(0, 20).trim() };
    }, { pid, rec, html, PROJECTID });
    console.log('  контейнер:', JSON.stringify(wr), Math.round(html.length / 1024) + 'KB');
    // мета — только со страницы /projects/
    await page.evaluate((id) => window.td__showform__EditPageSettings(id), pid);
    await page.waitForTimeout(3500);
    const mr = await page.evaluate(async (vals) => {
      const f = document.querySelector('#formpageedit'); if (!f) return { err: 'нет #formpageedit' };
      for (const [n, v] of Object.entries(vals)) { const el = f.querySelector(`[name="${n}"]`); if (!el || v == null) continue; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      const body = new URLSearchParams(); for (const [k, v] of new FormData(f).entries()) if (typeof v === 'string') body.append(k, v);
      const r = await fetch('/projects/submit/', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body.toString() });
      return { status: r.status, alias: (f.querySelector('[name="alias"]') || {}).value };
    }, { title: m.title, descr: (m.descr || '').slice(0, 140), alias: m.alias, meta_title: m.title, meta_descr: m.descr, link_canonical: m.canonical, fb_title: m.title, fb_descr: m.descr, imgfile: m.og || 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg', fb_imgfile: m.og || 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg' });
    console.log('  мета:', JSON.stringify(mr));
    await page.evaluate(() => { const b = [...document.querySelectorAll('a,button')].find((e) => /Закрыть/.test(e.innerText || '')); b && b.click(); });
    await pace(800, 1500);
    console.log('  publish:', await publishPage(page, pid).catch((e) => String(e).slice(0, 40)));
    await pace(1500, 2500);
  }
});
