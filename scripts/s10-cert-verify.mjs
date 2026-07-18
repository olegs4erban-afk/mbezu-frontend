import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const cdn = [];
p.on('response', (r) => { if (r.url().includes('certificate.webp')) cdn.push(r.status()); });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 80)));
await p.goto('https://mbezu.ru/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(4500);
const r = await p.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('certificate.webp'));
  const t = document.body.innerText;
  return {
    root: document.getElementById('root')?.children.length || 0,
    certImg: !!img,
    certLoaded: img ? img.naturalWidth > 0 : false,
    certAlt: img ? img.alt : null,
    packaging: /Картина приезжает/.test(t),
    greenBoxMB: /Thank you/.test(t) || /За доверие к ручной работе/.test(t),
  };
});
console.log(JSON.stringify(r), '| cert-http:', JSON.stringify(cdn), '| pageerrors:', errs.length);
const el = await p.$('img[src*="certificate"]');
if (el) {
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  const bb = await el.boundingBox();
  await p.screenshot({ path: 'audit/s10-packaging.png', clip: { x: 0, y: Math.max(0, bb.y - 70), width: 1440, height: 660 } });
}
await b.close();
