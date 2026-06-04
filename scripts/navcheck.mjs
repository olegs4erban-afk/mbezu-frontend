// navcheck.mjs — clicks each TopBar nav link from a starting page and verifies the
// destination returns 200 and #root renders. Reusable for the CDN and live Tilda.
//   BASE=https://cdn.mbezu.ru START=/ node scripts/navcheck.mjs
//   BASE=https://mbezu.ru     START=/legal node scripts/navcheck.mjs
import { chromium } from 'playwright';

const BASE = (process.env.BASE || 'http://127.0.0.1:4173').replace(/\/$/, '');
const START = process.env.START || '/';
const NAV = [
  ['Каталог', '/catalog'],
  ['На заказ', '/commission'],
  ['Художница', '/about'],
  ['Статус заказа', '/tracking'],
  ['Корзина', '/cart'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
let fail = 0;
console.log(`navcheck from ${BASE}${START}`);
for (const [label, expect] of NAV) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e?.message || e)));
  try {
    await page.goto(BASE + START, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root *', { timeout: 8000 }).catch(() => {});
    await page.locator('a', { hasText: label }).first().click({ timeout: 8000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(1500);
    const url = page.url();
    const root = await page.evaluate(() => { const r = document.getElementById('root'); return r ? r.children.length : 0; });
    let status = 0;
    try { status = (await fetch(url)).status; } catch { /* */ }
    const ok = status >= 200 && status < 400 && root > 0 && url.includes(expect);
    if (!ok) fail++;
    console.log(`${ok ? '✓' : '✗'} ${label.padEnd(16)} → ${url.replace(BASE, '') || '/'}  HTTP ${status}  root=${root}${errs.length ? '  ERR ' + errs[0].slice(0, 80) : ''}`);
  } catch (e) {
    fail++;
    console.log(`✗ ${label.padEnd(16)} click/nav failed: ${String(e?.message || e).slice(0, 110)}`);
  }
  await page.close();
}
await browser.close();
console.log(fail ? `NAVCHECK: ${fail} link(s) failed` : 'NAVCHECK: all nav links → 200 + rendered');
process.exit(fail ? 1 : 0);
