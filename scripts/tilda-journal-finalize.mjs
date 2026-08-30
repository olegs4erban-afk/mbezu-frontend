// Sprint 15 · Журнал: T123-шапка + мета/alias + публикация страницы 214647109.
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const PID = '214647109';
const T123 = '3447946001';
const html = readFileSync('content/journal.html', 'utf8');
const TITLE = 'Журнал о живописи — статьи художника Mila Bezú | mbezu.ru';
const DESCR = 'Как выбрать картину маслом для интерьера, оригинал или постер, сертификат подлинности: практичные статьи художника Mila Bezú о живописи и жизни мастерской.';

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.cc/page/?pageid=${PID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  const wr = await page.evaluate(async ({ pid, rid, code, projectid }) => {
    const r = await fetch('/page/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'saverecord', pageid: pid, recordid: rid, projectid, code, commfileexist: '' }).toString(),
    });
    return { status: r.status, body: (await r.text()).slice(0, 40).trim() };
  }, { pid: PID, rid: T123, code: html, projectid: PROJECTID });
  console.log('T123 saverecord:', JSON.stringify(wr));

  await page.evaluate((id) => window.td__showform__EditPageSettings(id), PID);
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
    title: TITLE,
    descr: DESCR.slice(0, 140),
    alias: 'journal',
    meta_title: TITLE,
    meta_descr: DESCR,
    link_canonical: 'https://mbezu.ru/journal',
    fb_title: TITLE,
    fb_descr: DESCR,
    imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg',
    fb_imgfile: 'https://cdn.mbezu.ru/og/og-catalog-1200x630.jpg',
  });
  console.log('мета:', JSON.stringify(mr));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('a,button')].find((e) => /Закрыть/.test(e.innerText || ''));
    b && b.click();
  });
  await pace(800, 1500);

  const pub = await publishPage(page, PID).catch((e) => String(e).slice(0, 60));
  console.log('publish:', pub);
});
