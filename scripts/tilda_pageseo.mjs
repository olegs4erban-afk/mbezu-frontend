// Sprint 14 (Ф3+Ф5) — правка SEO-настроек страницы Tilda.
// Метатеги mbezu.ru берутся НЕ из нашего prerender, а из настроек страницы Tilda
// (форма #formpageedit, comm=savepagesettings). Здесь: открываем «Настройки страницы»,
// подменяем нужные поля и отправляем ФОРМУ ЦЕЛИКОМ (FormData) — остальные 40+ полей
// сохраняются как есть. Затем публикуем страницу.
//
// Поля: title (имя страницы → og:title, тут было «Blank page»), meta_title, meta_descr,
//       link_canonical (пусто → Tilda генерит http://), fb_title/fb_descr (OG), imgfile/fb_imgfile (og:image).
//
// Запуск: MSYS_NO_PATHCONV=1 PAGE=home node scripts/tilda_pageseo.mjs   (APPLY=0 — только показать)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const PROJECTID = '13712449';
const APPLY = process.env.APPLY !== '0';
const OG = 'https://cdn.mbezu.ru/assets/og-banner.jpg';

// Ф5 — карта релевантности. canonical всегда https (Ф3.1).
const PAGES = {
  home: {
    pageid: '140814006',
    title: 'MBezu — картины маслом для интерьера',
    meta_title: 'Картины маслом для интерьера — Mila Bezú | Москва',
    meta_descr: 'Авторская живопись маслом в единственном экземпляре. Картины для интерьера дома, квартиры и дачи. Работа на заказ от 2 недель. Доставка по России.',
    link_canonical: 'https://mbezu.ru/',
  },
  home2: {
    pageid: '142947296',
    title: 'MBezu — картины маслом для интерьера',
    meta_title: 'Картины маслом для интерьера — Mila Bezú | Москва',
    meta_descr: 'Авторская живопись маслом в единственном экземпляре. Картины для интерьера дома, квартиры и дачи. Работа на заказ от 2 недель. Доставка по России.',
    link_canonical: 'https://mbezu.ru/',
  },
  catalog: {
    pageid: '142948046',
    title: 'Каталог картин маслом — MBezu',
    meta_title: 'Купить картину маслом для интерьера — 21 работа | MBezu',
    meta_descr: 'Картины маслом на холсте от художника Mila Bezú. Оригиналы в единственном экземпляре с сертификатом подлинности. Доставка по РФ, оплата онлайн.',
    link_canonical: 'https://mbezu.ru/catalog',
  },
  about: {
    pageid: '142948406',
    title: 'Mila Bezú — художник',
    meta_title: 'Mila Bezú — художник, живопись маслом | Москва',
    meta_descr: 'Художник-живописец из Москвы. 15 лет масляной живописи: пейзаж, город, ботаника, монохром. Работы в наличии и на заказ, сертификат подлинности.',
    link_canonical: 'https://mbezu.ru/about',
  },
  commission: {
    pageid: '142949736',
    title: 'Картина на заказ — MBezu',
    meta_title: 'Картина на заказ маслом — от 2 недель | MBezu Москва',
    meta_descr: 'Напишем картину маслом на заказ под ваш интерьер: размер, палитра, сюжет. Эскизы до начала работы. Срок от 2 недель, доставка по России.',
    link_canonical: 'https://mbezu.ru/commission',
  },
  legal: {
    pageid: '142950726',
    title: 'Документы и реквизиты — MBezu',
    meta_title: 'Документы и реквизиты — MBezu | оферта, доставка, возврат',
    meta_descr: 'Публичная оферта, политика обработки персональных данных, условия доставки и возврата, реквизиты ИП. Интернет-магазин картин MBezu.',
    link_canonical: 'https://mbezu.ru/legal',
  },
};

const key = process.env.PAGE;
if (!key || !PAGES[key]) { console.log('need PAGE=' + Object.keys(PAGES).join('|')); process.exit(2); }
const cfg = PAGES[key];

const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
if (/captcha|recaptcha/i.test(await page.content())) { console.log('CAPTCHA — abort'); await browser.close(); process.exit(7); }

await page.goto(`https://tilda.ru/page/?pageid=${cfg.pageid}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.evaluate(() => {
  const el = [...document.querySelectorAll('a,button,div')].find((e) => /^настройки страницы$/i.test((e.innerText || '').trim()));
  el && el.click();
});
await page.waitForTimeout(6000);

const before = await page.evaluate(() => {
  const f = document.querySelector('#formpageedit');
  if (!f) return null;
  const g = (n) => (f.querySelector(`[name="${n}"]`) || {}).value ?? null;
  return { title: g('title'), meta_title: g('meta_title'), meta_descr: g('meta_descr'), link_canonical: g('link_canonical'), fb_title: g('fb_title'), imgfile: g('imgfile') };
});
if (!before) { console.log('form #formpageedit NOT found'); await browser.close(); process.exit(5); }
console.log(`[${key}] BEFORE:`, JSON.stringify(before, null, 1));

if (!APPLY) { console.log('INSPECT-only (APPLY=0)'); await browser.close(); process.exit(0); }

const res = await page.evaluate(async ({ cfg, OG }) => {
  const f = document.querySelector('#formpageedit');
  const set = (n, v) => { const el = f.querySelector(`[name="${n}"]`); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; } return false; };
  const applied = {
    title: set('title', cfg.title),
    meta_title: set('meta_title', cfg.meta_title),
    meta_descr: set('meta_descr', cfg.meta_descr),
    link_canonical: set('link_canonical', cfg.link_canonical),
    fb_title: set('fb_title', cfg.meta_title),
    fb_descr: set('fb_descr', cfg.meta_descr),
    imgfile: set('imgfile', OG),
    fb_imgfile: set('fb_imgfile', OG),
  };
  const fd = new FormData(f);
  const body = new URLSearchParams();
  for (const [k, v] of fd.entries()) if (typeof v === 'string') body.append(k, v);
  const resp = await fetch(f.action, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body.toString() });
  const t = await resp.text();
  return { applied, status: resp.status, head: t.slice(0, 120).replace(/\s+/g, ' ') };
}, { cfg, OG });
console.log(`[${key}] SAVE:`, JSON.stringify(res));

// publish
const pub = await page.evaluate(async ({ pageid, PROJECTID }) => {
  const r = await fetch('/page/publish/', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams({ pageid, projectid: PROJECTID }).toString() });
  return r.status;
}, { pageid: cfg.pageid, PROJECTID });
console.log(`[${key}] publish: ${pub}`);
await browser.close();
