// Страница /journal: дубль legal → шапка-контейнер в T123 + блок Потоков из библиотеки.
import { readFileSync, writeFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const DONOR = '142950726';
const KNOWN = new Set(['140814006', '142947296', '142948046', '142948406', '142949736',
  '142949956', '142950276', '142950726', '143102566', '143103886', '143107666',
  '213877409', '213877609', '213877809', '213877909', '214634909']);

await withSession(async ({ page }) => {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.setViewportSize({ width: 1600, height: 1100 });
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
  console.log('journal pageid:', pid);
  writeFileSync('.secrets/journal-page.json', JSON.stringify({ pid }));

  // Открыть редактор новой страницы и вставить блок Потоков
  await page.goto(`https://tilda.ru/page/?pageid=${pid}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  const before = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
  const click = async (txt, wait, sel) => {
    const p = await page.evaluate(({ txt, sel }) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const pool = sel ? [...document.querySelectorAll(sel)] : [...document.querySelectorAll('a,button,div,li')];
      const el = pool.filter(vis).find((e) => (e.innerText || '').trim() === txt || (sel && new RegExp(txt).test(e.innerText || '')));
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, { txt, sel });
    if (!p) throw new Error('не найдено: ' + txt);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(wait);
  };
  await click('ВСЕ БЛОКИ', 4000);
  await click('Потоки и CMS', 9000);
  // список шаблонов потоков
  const tpls = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 60 && r.height > 40; };
    return [...document.querySelectorAll('.tp-library__tpl-body')].filter(vis)
      .map((e) => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40)).slice(0, 10);
  });
  console.log('шаблоны потоков:', tpls.join(' | '));
  await click('FD201N', 8000, '.tp-library__tpl-body');
  const after = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
  const rec = after.filter((id) => !before.includes(id)).map((id) => id.replace('record', ''))[0];
  console.log('вставлен блок потока:', rec);
  await page.screenshot({ path: 'audit/journal-inserted.png' });
});
