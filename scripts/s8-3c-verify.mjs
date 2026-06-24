// 3C E2E: live home renders → click a work → lands on native Store product page with add-to-cart.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 1400 } });

// 1) render checks on the reconnected pages
for (const u of ['https://mbezu.ru/', 'https://mbezu.ru/commission']) {
  const p = await ctx.newPage();
  await p.goto(u, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({
    root: document.getElementById('root')?.children.length || 0,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    cart706: !!document.querySelector('#rec2293310791, [id*="rec2293310791"]') || /корзин/i.test(document.body.innerText),
    common: [...document.scripts, ...document.querySelectorAll('link')].some((e) => /common-85XhhDAw/.test(e.src || e.href || '')),
  }));
  console.log(`${u} → root=${r.root} accent=${r.accent} cart=${r.cart706} newCommon=${r.common}`);
  await p.close();
}

// 2) click a work on home → expect navigation to /catalog/tproduct/...
const p = await ctx.newPage();
await p.goto('https://mbezu.ru/home', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(3000);
const before = p.url();
let card = p.locator('img[src*="/assets/cards/"]').first();
if (!(await card.count())) card = p.locator('[class*="card"] img, figure img').first();
await card.scrollIntoViewIfNeeded().catch(() => {});
await card.click({ timeout: 8000 }).catch((e) => console.log('click err', e.message.split('\n')[0]));
await p.waitForURL(/\/catalog\/tproduct\/|\/painting\//, { timeout: 10000 }).catch(() => {});
await p.waitForTimeout(2500);
const after = p.url();
const dest = await p.evaluate(() => ({
  isProduct: /\/catalog\/tproduct\//.test(location.href),
  hasBuy: /в корзину|добавить в корзин|купить|оформить заказ/i.test(document.body.innerText),
  price: (document.body.innerText.match(/\d[\d  ]{3,}\s*(?:р\.|₽|руб)/i) || [''])[0],
  title: document.title.slice(0, 40),
}));
console.log(`\nWORK CLICK: ${before}  →  ${after}`);
console.log(`  native product page: ${dest.isProduct} | has add-to-cart/buy: ${dest.hasBuy} | price: ${dest.price} | title: ${dest.title}`);
console.log(dest.isProduct && dest.hasBuy ? '3C VERIFY: PASS' : '3C VERIFY: CHECK');
await browser.close();
