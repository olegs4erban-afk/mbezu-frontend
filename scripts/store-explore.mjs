// Read-only explore of the Tilda Store admin for project 13712449:
// locate product catalog + import mechanism + current product/price snapshot. No writes.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const PROJECTID = '13712449';
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
if (/\/login/.test(page.url())) { console.log('LOGIN FAILED'); await browser.close(); process.exit(3); }
console.log('logged in, url=', page.url());

mkdirSync('audit', { recursive: true });
const tries = [
  `https://tilda.cc/store/?projectid=${PROJECTID}`,
  `https://tilda.cc/store/products/?projectid=${PROJECTID}`,
  `https://store.tilda.cc/?projectid=${PROJECTID}`,
  `https://tilda.cc/projects/?projectid=${PROJECTID}`,
];
for (const url of tries) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.log('goto err', e.message));
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
    const links = [...document.querySelectorAll('a')].map((a) => ({ t: (a.innerText || '').trim().slice(0, 30), h: a.getAttribute('href') || '' }))
      .filter((x) => /store|товар|catalog|import|product|магазин|импорт/i.test(x.t + ' ' + x.h)).slice(0, 25);
    const btns = [...document.querySelectorAll('button,[class*="btn"],[onclick]')].map((b) => (b.innerText || '').trim()).filter((t) => /импорт|import|товар|product|загруз|csv|export|экспорт/i.test(t)).slice(0, 20);
    const fns = Object.keys(window).filter((k) => /store|tstore|product|catalog/i.test(k)).slice(0, 30);
    return { title: document.title, has_import: /импорт|import/i.test(txt), products_word: /товаров|products?/i.test(txt), links, btns, fns, bodyHead: txt.slice(0, 240) };
  });
  console.log('\n== ', url, ' ==');
  console.log('  url-now:', page.url(), '| title:', info.title);
  console.log('  has_import:', info.has_import, '| products_word:', info.products_word);
  console.log('  store-fns:', info.fns.join(', ') || '—');
  console.log('  links:', JSON.stringify(info.links.slice(0, 12)));
  console.log('  btns:', JSON.stringify(info.btns));
  console.log('  head:', info.bodyHead);
}
await page.screenshot({ path: 'audit/store-explore.png', fullPage: false }).catch(() => {});
await browser.close();
