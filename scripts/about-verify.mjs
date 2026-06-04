// Focused verification of the reconnected live /about: render + console + CDN + native cart.
import { chromium } from 'playwright';
const URL = 'https://mbezu.ru/about';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = [], cdn = [];
page.on('pageerror', (e) => errors.push(String(e?.message || e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('response', (r) => { if (r.url().includes('cdn.mbezu.ru')) cdn.push(`${r.status()} ${r.url().split('/').pop()}`); });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForFunction(() => { const r = document.getElementById('root'); return r && r.children.length > 0; }, { timeout: 12000 }).catch(() => {});
const info = await page.evaluate(() => {
  const r = document.getElementById('root');
  return {
    rootChildren: r ? r.children.length : 0,
    rootText: r ? (r.innerText || '').length : 0,
    has706: !!document.querySelector('[data-record-type="706"]'),
    title: document.title,
  };
});
const cdnBad = cdn.filter((x) => !x.startsWith('2') && !x.startsWith('3'));
console.log('rootChildren:', info.rootChildren, '| rootText:', info.rootText, '| nativeCart(706):', info.has706);
console.log('title:', JSON.stringify(info.title));
console.log('cdn requests:', cdn.length, '| non-2xx/3xx:', cdnBad.length, cdnBad.slice(0, 5));
console.log('errors:', errors.length); errors.slice(0, 5).forEach((e) => console.log('  ', e.slice(0, 140)));
const ok = info.rootChildren > 0 && errors.length === 0 && cdnBad.length === 0 && info.has706;
console.log(ok ? 'ABOUT VERIFY: PASS' : 'ABOUT VERIFY: FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
