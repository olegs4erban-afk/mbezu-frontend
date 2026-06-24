// Snapshot current Tilda Store products (export CSV = rollback point) + inspect the import dialog (no submit).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const PROJECTID = '13712449';
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
console.log('store url:', page.url());
mkdirSync('backup', { recursive: true });

// product count + price snapshot from the listing DOM
const snap = await page.evaluate(() => {
  const txt = (document.body.innerText || '');
  const prods = [...document.querySelectorAll('[class*="product"],[data-product-uid],[id*="product"]')].length;
  // price-ish tokens
  const prices = (txt.match(/\d[\d  ]{2,}\d\s*(?:₽|руб|р\.)/gi) || []).slice(0, 40);
  return { prods, prices };
});
console.log('listing products(approx):', snap.prods, '| price tokens:', JSON.stringify(snap.prices));

// Try to capture the export-CSV download
let exported = false;
try {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.evaluate(() => {
      // find the export control by text
      const el = [...document.querySelectorAll('a,button,[onclick],li,div,span')].find((e) => /Скачать список товаров в CSV/i.test((e.innerText || '')));
      if (el) el.click();
    }),
  ]);
  await download.saveAs('backup/store-current.csv');
  exported = true;
  console.log('EXPORT saved -> backup/store-current.csv (', download.suggestedFilename(), ')');
} catch (e) {
  console.log('export-click path failed:', e.message);
}

// Inspect the import dialog (open, don't submit)
const imp = await page.evaluate(() => {
  const el = [...document.querySelectorAll('a,button,[onclick],li,div,span')].find((e) => /Импортировать \(или обновить\) товары из CSV/i.test((e.innerText || '')));
  if (el) { const oc = el.getAttribute('onclick') || ''; el.click(); return { clicked: true, onclick: oc }; }
  return { clicked: false };
});
await page.waitForTimeout(3000);
const dlg = await page.evaluate(() => {
  const fileInputs = [...document.querySelectorAll('input[type="file"]')].map((i) => ({ name: i.name, accept: i.accept, id: i.id, visible: i.offsetParent !== null }));
  const forms = [...document.querySelectorAll('form')].map((f) => ({ action: f.action, id: f.id })).filter((f) => /import|store|csv/i.test(f.action + f.id));
  const dialogText = ([...document.querySelectorAll('[class*="popup"],[class*="modal"],[class*="dialog"]')].map((d) => (d.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean)[0] || '').slice(0, 400);
  return { fileInputs, forms, dialogText };
});
console.log('import clicked:', imp.clicked, '| onclick:', imp.onclick.slice(0, 120));
console.log('file inputs:', JSON.stringify(dlg.fileInputs));
console.log('import forms:', JSON.stringify(dlg.forms));
console.log('dialog text:', dlg.dialogText);
await page.screenshot({ path: 'audit/store-import-dialog.png', fullPage: false }).catch(() => {});
await browser.close();
