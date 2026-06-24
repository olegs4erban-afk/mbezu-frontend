// Scrape Mila Bezú's full bizar.art listings (read-only): {slug,title,artist,size,price} across offsets.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const Q = 'https://bizar.art/artwork?q=Bez%C3%BA+%D0%9C%D0%B8%D0%BB%D0%B0&offset=';
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 1440, height: 1600 }, locale: 'ru-RU',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
})).newPage();

const all = new Map();
let emptyRounds = 0;
for (let offset = 0; offset <= 300; offset += 30) {
  await page.goto(Q + offset, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await page.waitForTimeout(1500);
  const cards = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href*="/artwork/"]')) {
      const href = (a.getAttribute('href') || '').split('?')[0];
      if (!href || !/\/artwork\/[a-z0-9-]+$/i.test(href) || seen.has(href)) continue;
      seen.add(href);
      const card = a.closest('[class*="card"],[class*="Card"],li,article,[class*="cardInfo"]') || a.parentElement?.parentElement || a;
      const text = (card?.innerText || '').replace(/\s+/g, ' ').trim();
      const price = (text.match(/\d[\d\s]{2,}\d\s*(?:₽|руб|р\.)/i) || [])[0] || '';
      const size = (text.match(/\d{1,3}\s*[×xхX]\s*\d{1,3}(\s*см)?/) || [])[0] || '';
      out.push({ href, text: text.slice(0, 180), price, size });
    }
    return out;
  });
  let added = 0;
  for (const c of cards) if (!all.has(c.href)) { all.set(c.href, c); added++; }
  console.log(`offset ${offset}: found=${cards.length} new=${added} total=${all.size}`);
  if (added === 0) { if (++emptyRounds >= 2) break; } else emptyRounds = 0;
}
const arr = [...all.values()];
mkdirSync('audit', { recursive: true });
writeFileSync('audit/bizar-raw.json', JSON.stringify(arr, null, 1));
console.log(`\nTOTAL distinct artworks: ${arr.length}`);
for (const c of arr) console.log(`  ${c.href.replace('/artwork/', '').padEnd(28)} | ${c.price.padStart(11)} | ${c.size.padEnd(10)} | ${c.text.slice(0, 60)}`);
await browser.close();
