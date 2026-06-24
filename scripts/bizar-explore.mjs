// Explore bizar.art search structure for Mila Bezú listings (read-only).
import { chromium } from 'playwright';
const URL = process.env.URL || 'https://bizar.art/artwork?q=Bez%C3%BA+%D0%9C%D0%B8%D0%BB%D0%B0&offset=0';
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'ru-RU',
})).newPage();
let status = 0;
page.on('response', (r) => { if (r.url() === URL || r.url().startsWith('https://bizar.art/artwork')) status = status || r.status(); });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('goto:', e.message));
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const txt = document.body.innerText || '';
  const links = [...document.querySelectorAll('a[href*="/artwork/"]')].map((a) => a.getAttribute('href'));
  // price-ish tokens
  const prices = (txt.match(/\d[\d  ]{2,}(₽|руб|р\.)/gi) || []).slice(0, 10);
  // any card containers
  const guessClasses = [...new Set([...document.querySelectorAll('[class*="card"],[class*="item"],[class*="product"],[class*="artwork"]')].map((e) => e.className).filter(Boolean))].slice(0, 12);
  return {
    title: document.title,
    bodyLen: txt.length,
    bodyHead: txt.slice(0, 300).replace(/\n+/g, ' | '),
    artworkLinks: links.length,
    sampleLinks: [...new Set(links)].slice(0, 8),
    priceSamples: prices,
    guessClasses,
    login: /войти|log\s?in|sign\s?in|регистрац/i.test(txt) && txt.length < 1500,
    challenge: /captcha|cloudflare|проверка|robot|are you human/i.test(txt),
  };
});
console.log('status:', status);
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'audit/bizar-explore.png', fullPage: false }).catch(() => {});
await browser.close();
