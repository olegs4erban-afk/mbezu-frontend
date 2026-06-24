// Inspect Tilda Store admin controls precisely: tag/href/onclick/visibility of export+import; screenshot.
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
mkdirSync('audit', { recursive: true });

const ctrls = await page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('a,button,[onclick],li,span,div')) {
    const t = (e.innerText || '').trim();
    if (/Импортировать.*из CSV|Скачать список товаров в CSV|товары из CSV/i.test(t) && t.length < 80) {
      out.push({ tag: e.tagName, t: t.slice(0, 60), href: e.getAttribute('href') || '', onclick: (e.getAttribute('onclick') || '').slice(0, 140), id: e.id, cls: (e.className || '').toString().slice(0, 60), visible: e.offsetParent !== null });
    }
  }
  // also find the menu trigger (gear/ellipsis/Ещё)
  const triggers = [...document.querySelectorAll('a,button,[onclick],span,div')].map((e) => ({ t: (e.innerText || '').trim().slice(0, 24), oc: (e.getAttribute('onclick') || '').slice(0, 80) }))
    .filter((x) => /Ещё|Настройк|Импорт.экспорт|⋯|···|меню|gear|tstore_(import|export|showImport)/i.test(x.t + x.oc)).slice(0, 12);
  // global tstore import/export fns
  const fns = Object.keys(window).filter((k) => /import|export|csv|upload/i.test(k) && /tstore|store/i.test(k)).slice(0, 20);
  return { out: out.slice(0, 10), triggers, fns };
});
console.log('export/import controls:', JSON.stringify(ctrls.out, null, 1));
console.log('menu triggers:', JSON.stringify(ctrls.triggers));
console.log('import/export fns:', ctrls.fns.join(', ') || '—');
await page.screenshot({ path: 'audit/store-admin.png', fullPage: false }).catch(() => {});
console.log('screenshot -> audit/store-admin.png');
await browser.close();
