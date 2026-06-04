// Focused verification of a reconnected page: render + SITE resources + native cart.
// Ignores third-party failures (Google Fonts / analytics) that are flaky from the
// sandbox network and are non-blocking for real users.
import { chromium } from 'playwright';
const URL = process.env.URL || 'https://mbezu.ru/about';
const THIRD_PARTY = ['fonts.gstatic.com', 'fonts.googleapis.com', 'api.qrserver.com', 'mc.yandex.ru', 'google-analytics.com', 'googletagmanager.com', 'vk.com', 'unpkg.com'];
const isThirdParty = (u) => THIRD_PARTY.some((d) => u.includes(d));

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const jsErrors = [], siteFails = [], tpFails = [], cdn = [];
page.on('pageerror', (e) => jsErrors.push(String(e?.message || e)));
page.on('requestfailed', (r) => { const u = r.url(); (isThirdParty(u) ? tpFails : siteFails).push('FAILED ' + u.split('/').slice(2).join('/').slice(0, 80)); });
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('cdn.mbezu.ru')) cdn.push(r.status());
  if (r.status() >= 400) (isThirdParty(u) ? tpFails : siteFails).push(r.status() + ' ' + u.split('/').slice(2).join('/').slice(0, 80));
});
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await page.waitForFunction(() => { const r = document.getElementById('root'); return r && r.children.length > 0; }, { timeout: 12000 }).catch(() => {});
const info = await page.evaluate(() => {
  const r = document.getElementById('root');
  // count loaded artwork images (naturalWidth > 0 = actually loaded)
  const imgs = [...document.querySelectorAll('#root img')];
  const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
  return { rootChildren: r ? r.children.length : 0, rootText: r ? (r.innerText || '').length : 0,
    has706: !!document.querySelector('[data-record-type="706"]'), title: document.title,
    imgTotal: imgs.length, imgLoaded: loaded };
});
const cdnBad = cdn.filter((s) => s >= 400).length;
const requireCart = /\/\/mbezu\.ru/.test(URL); // native 706 cart exists on live Tilda only, not on CDN
console.log(`root=${info.rootChildren} text=${info.rootText} imgs=${info.imgLoaded}/${info.imgTotal} nativeCart=${info.has706}${requireCart ? '' : ' (n/a on cdn)'}`);
console.log(`title: ${JSON.stringify(info.title)}`);
console.log(`cdn reqs=${cdn.length} bad=${cdnBad} | site-fails=${siteFails.length} | thirdparty-fails(ignored)=${tpFails.length} | jsErrors=${jsErrors.length}`);
siteFails.slice(0, 6).forEach((f) => console.log('  SITE-FAIL:', f));
jsErrors.slice(0, 4).forEach((e) => console.log('  JS-ERR:', e.slice(0, 120)));
const ok = info.rootChildren > 0 && jsErrors.length === 0 && siteFails.length === 0 && cdnBad === 0 && (!requireCart || info.has706) && (info.imgTotal === 0 || info.imgLoaded > 0);
console.log(ok ? 'VERIFY: PASS' : 'VERIFY: FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
