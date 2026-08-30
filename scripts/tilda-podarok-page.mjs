// Посадочная «Картина в подарок» /podarok (план роста, шаг 5).
// Тот же конвейер, что и серии: дубль legal → T123 → контейнер → мета → publish.
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const DONOR = '142950726';
const KNOWN = new Set(['140814006', '142947296', '142948046', '142948406', '142949736',
  '142949956', '142950276', '142950726', '143102566', '143103886', '143107666',
  '213877409', '213877609', '213877809', '213877909']);
const META = {
  title: 'Картина в подарок — оригинал маслом | Mila Bezú',
  descr: 'Картина маслом в подарок: единственный экземпляр с сертификатом подлинности. Готовые работы от 6 000 ₽ и на заказ от 2 недель. Доставка по России.',
  alias: 'podarok',
  canonical: 'https://mbezu.ru/podarok',
};

await withSession(async ({ page }) => {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  const listPages = () => page.evaluate(() =>
    [...new Set([...document.querySelectorAll('a[href*="/page/?pageid="]')]
      .map((a) => (a.getAttribute('href').match(/pageid=(\d+)/) || [])[1]).filter(Boolean))]);
  let fresh = (await listPages()).filter((id) => !KNOWN.has(id));
  if (!fresh.length) {
    await page.evaluate((id) => window.td__pagesettings__dublicatePage(id), DONOR);
    await page.waitForTimeout(6000);
    await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    fresh = (await listPages()).filter((id) => !KNOWN.has(id));
  }
  const pid = fresh[0];
  console.log('страница:', pid);
  if (!pid) throw new Error('копия не создалась');

  const rec = await page.evaluate(async ({ pid, PROJECTID }) => {
    const r = await fetch('/page/get/getpage/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ pageid: pid, projectid: PROJECTID }).toString(),
    });
    const j = JSON.parse(await r.text());
    const t123 = (j.records || []).find((x) => String(x.tplid) === '131');
    const m = String(t123?.html || '').match(/recordid="([0-9]+)"/);
    return m ? m[1] : null;
  }, { pid, PROJECTID });
  console.log('T123:', rec);

  const html = readFileSync('content/podarok.html', 'utf8');
  const wr = await page.evaluate(async ({ pid, rec, html, PROJECTID }) => {
    const r = await fetch('/page/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'saverecord', pageid: pid, recordid: rec, projectid: PROJECTID, code: html, commfileexist: '' }).toString(),
    });
    return (await r.text()).slice(0, 20).trim();
  }, { pid, rec, html, PROJECTID });
  console.log('saverecord:', wr);

  await page.evaluate((id) => window.td__showform__EditPageSettings(id), pid);
  await page.waitForTimeout(3500);
  const mr = await page.evaluate(async (vals) => {
    const f = document.querySelector('#formpageedit');
    if (!f) return { err: 'нет формы' };
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
    title: META.title, descr: META.descr.slice(0, 140), alias: META.alias,
    meta_title: META.title, meta_descr: META.descr, link_canonical: META.canonical,
    fb_title: META.title, fb_descr: META.descr,
    imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg', fb_imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg',
  });
  console.log('мета:', JSON.stringify(mr));
  await pace();
  console.log('publish:', await publishPage(page, pid).catch((e) => String(e).slice(0, 40)));
});
