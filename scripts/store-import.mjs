// Drive Tilda Store CSV import. Default: STOP at step-2 preview/options (no catalog change).
// Set CONFIRM=1 to click the final import button. FILE=path to CSV (default v3).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const PROJECTID = '13712449';
const FILE = process.env.FILE || 'C:/MBezu/02-tilda-store-import-v3.csv';
const CONFIRM = process.env.CONFIRM === '1';
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('filechooser', async (fc) => { try { await fc.setFiles(FILE); console.log('filechooser -> set', FILE); } catch (e) { console.log('fc err', e.message); } });
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);

await page.evaluate(() => window.scrollTo(0, 0));
// ⋯ menu → import item opens a MODAL (no native chooser yet) → set file on the modal's input.
let chosen = false;
try {
  await page.locator('.tstore__etc-btn').first().click({ timeout: 6000 });
  await page.waitForTimeout(1000);
  await page.locator('.tstore__etc-btn__menu-item', { hasText: 'Импортировать (или обновить) товары из CSV' }).first().click({ timeout: 8000 });
  await page.waitForTimeout(2500); // modal renders
  await page.screenshot({ path: 'audit/store-import-modal.png' }).catch(() => {});
  // The modal's "Загрузить файл" button triggers the native chooser.
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15000 }),
    page.getByText('Загрузить файл', { exact: false }).first().click({ timeout: 8000 }),
  ]);
  await fc.setFiles(FILE);
  chosen = true;
  console.log('Загрузить файл -> chooser -> set', FILE);
} catch (e) {
  console.log('menu/modal path failed:', e.message.split('\n')[0]);
}
console.log('file chosen:', chosen, '| still logged in:', !/\/login/.test(page.url()));
await page.waitForTimeout(8000); // upload + post-upload options/preview render
await page.screenshot({ path: 'audit/store-import-loaded.png', fullPage: true }).catch(() => {});
await page.waitForTimeout(7000); // upload + step2 render

// dump step2 state
const step2 = await page.evaluate(() => {
  const pop = document.querySelector('[class*="popup"],[class*="modal"],[id*="import"],[class*="import"]');
  const text = (pop ? pop.innerText : document.body.innerText).replace(/\s+/g, ' ').slice(0, 900);
  const checks = [...document.querySelectorAll('input[type="checkbox"]')].map((c) => ({ id: c.id, name: c.name, checked: c.checked, near: (c.closest('label,div')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), visible: c.offsetParent !== null })).filter((c) => c.visible);
  const selects = [...document.querySelectorAll('select')].filter((s) => s.offsetParent !== null).map((s) => ({ name: s.name, value: s.value, opts: [...s.options].map((o) => o.text).slice(0, 8) }));
  const buttons = [...document.querySelectorAll('a,button,div[onclick],span[onclick]')].filter((b) => b.offsetParent !== null && /импорт|import|загруз|применить|продолж|next|готов/i.test(b.innerText || '')).map((b) => ({ t: (b.innerText || '').trim().slice(0, 40), oc: (b.getAttribute('onclick') || '').slice(0, 100) })).slice(0, 12);
  return { text, checks, selects, buttons };
});
console.log('\n== STEP2 ==');
console.log('text:', step2.text);
console.log('checks:', JSON.stringify(step2.checks, null, 1));
console.log('selects:', JSON.stringify(step2.selects));
console.log('buttons:', JSON.stringify(step2.buttons, null, 1));
await page.screenshot({ path: 'audit/store-import-step2.png', fullPage: true }).catch(() => {});
console.log('screenshot -> audit/store-import-step2.png');

if (CONFIRM) {
  console.log('\n!! CONFIRM=1 — committing import to live catalog');
  // trusted click on the modal's active "Импортировать" (exact text; menu items are longer)
  let click1 = null;
  try { await page.getByText('Импортировать', { exact: true }).last().click({ timeout: 8000 }); click1 = 'Импортировать (getByText exact)'; }
  catch (e) { console.log('commit click failed:', e.message.split('\n')[0]); }
  console.log('commit click 1:', click1);
  await page.waitForTimeout(4000); // step2 (column mapping + options) renders
  await page.screenshot({ path: 'audit/store-import-after-confirm.png', fullPage: true }).catch(() => {});
  // step2: set "replace images" ON, leave "only update existing" OFF; dump candidate finalize buttons
  const step2 = await page.evaluate(() => {
    const out = { setReplace: false, replaceChecked: null, labels: [], finals: [] };
    for (const c of document.querySelectorAll('input[type="checkbox"]')) {
      const lbl = (c.closest('label,div')?.innerText || '').replace(/\s+/g, ' ').trim();
      if (lbl) out.labels.push((c.checked ? '[x] ' : '[ ] ') + lbl.slice(0, 55));
      if (/заменить имеющиеся изображ/i.test(lbl)) {
        // Tilda styled checkbox: click the label, then force-check + dispatch as fallback
        const l = c.closest('label') || c.parentElement;
        if (!c.checked && l) l.click();
        if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('click', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }
        out.setReplace = true; out.replaceChecked = c.checked;
      }
    }
    for (const e of document.querySelectorAll('a,button,div[onclick],span[onclick],div[class*="btn"]')) {
      const t = (e.innerText || '').trim(); const oc = (e.getAttribute('onclick') || '');
      if ((/импорт|начать|готов|применить|продолж/i.test(t) && t.length < 40) || /import.*step|processFile|do.?import|tstore_import_(start|do|run|process|csv_step)/i.test(oc))
        out.finals.push({ t: t.slice(0, 30), oc: oc.slice(0, 70), cls: (e.className || '').toString().slice(0, 40) });
    }
    return out;
  });
  console.log('step2 setReplace:', step2.setReplace, '| replaceChecked:', step2.replaceChecked, '| labels:', JSON.stringify(step2.labels));
  console.log('step2 finalize candidates:', JSON.stringify(step2.finals, null, 1));
  // scroll modal to bottom and click the finalize button (trusted), trying exact labels
  await page.evaluate(() => { const m = document.querySelector('[class*="popup"],[class*="modal"]'); if (m) m.scrollTop = m.scrollHeight; window.scrollTo(0, document.body.scrollHeight); });
  await page.waitForTimeout(800);
  let click2 = null;
  // exact finalize button: class .btn_importcsv_proccess, text "Начать запись данных"
  try { const b = page.locator('.btn_importcsv_proccess').first(); if (await b.count()) { await b.click({ timeout: 6000 }); click2 = '.btn_importcsv_proccess'; } } catch (e) { console.log('proccess-btn err', e.message.split('\n')[0]); }
  if (!click2) {
    for (const label of ['Начать запись данных', 'Импортировать', 'Начать импорт', 'Применить']) {
      try { const loc = page.getByText(label, { exact: true }); if (await loc.count()) { await loc.last().click({ timeout: 5000 }); click2 = label; break; } } catch (e) { /* next */ }
    }
  }
  console.log('step2 finalize click:', click2);
  // WAIT for real completion — do NOT break on the progress word "Импортировано N%".
  let done = false;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(4000);
    const st = await page.evaluate(() => {
      const t = document.body.innerText || '';
      const pct = (t.match(/Импортировано\s+(\d+)\s*%/i) || [])[1];
      const fin = (t.match(/(импорт (?:завершён|завершен|окончен)|готово|успешно|обновлено\s+\d+|добавлено\s+\d+|товаров обработано|ошибк[аи][^.\n]{0,80}|error)/i) || [''])[0];
      const modalGone = !document.querySelector('.btn_importcsv_proccess');
      return { pct: pct ? Number(pct) : null, fin, modalGone };
    });
    console.log(`status@${i}: pct=${st.pct} fin=${JSON.stringify(st.fin)} modalGone=${st.modalGone}`);
    if (st.pct === 100 || /завершён|завершен|окончен|готово|успешно|обновлено \d|добавлено \d|обработано|ошибк|error/i.test(st.fin)) { done = true; break; }
  }
  console.log('import done:', done);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'audit/store-import-result.png', fullPage: true }).catch(() => {});
}
await browser.close();
