// Snapshot the live Tilda Store: trigger tstore_start_export('csv'), capture the download -> backup/store-current.csv
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
await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);
mkdirSync('backup', { recursive: true });

page.on('download', async (d) => {
  try { await d.saveAs('backup/store-current.csv'); console.log('DOWNLOAD saved -> backup/store-current.csv (', d.suggestedFilename(), ')'); }
  catch (e) { console.log('saveAs err', e.message); }
});

const r = await page.evaluate(() => {
  if (typeof window.tstore_start_export === 'function') { window.tstore_start_export('csv'); return 'called tstore_start_export(csv)'; }
  return 'fn missing';
});
console.log(r);
// export runs server-side; wait, then look for a result download link
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(3000);
  const link = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => /\.csv|download|скачать файл|скачать результат/i.test((x.href || '') + ' ' + (x.innerText || '')) && /csv|export|download/i.test(x.href || ''));
    return a ? a.href : null;
  });
  if (link) { console.log('result link found:', link); await page.evaluate((h) => { const a = document.createElement('a'); a.href = h; a.download = ''; document.body.appendChild(a); a.click(); }, link); await page.waitForTimeout(4000); break; }
  const done = await page.evaluate(() => /готов|заверш|done|complete|успешно/i.test(document.body.innerText || ''));
  if (done) console.log('export status text indicates done @try', i);
}
await page.waitForTimeout(3000);
await page.screenshot({ path: 'audit/store-export.png' }).catch(() => {});
await browser.close();
