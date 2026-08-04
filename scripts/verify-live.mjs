// ─────────────────────────────────────────────────────────────
// verify-live.mjs (Sprint 15, Ф1.3) — приёмка ПО ДОМЕНУ, а не по сборке.
//
// Урок Sprint 14: «сгенерировано в репозитории» ≠ «отдаётся доменом». Поэтому
// проверка ходит на https://mbezu.ru от имени YandexBot, БЕЗ выполнения JS,
// и падает с exit 1 при первом несоответствии. Состояние домена = тест, а не вера.
//
// Запуск:  npm run verify           (все страницы)
//          PAGES=home,catalog npm run verify
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';
const ORIGIN = process.env.VERIFY_ORIGIN || 'https://mbezu.ru';
const cfg = JSON.parse(readFileSync('seo/pages.json', 'utf-8')).pages;
const only = (process.env.PAGES || '').split(',').map((s) => s.trim()).filter(Boolean);
// /home — намеренный дубль до Ф3.3, отдельно его не гоняем
const names = (only.length ? only : Object.keys(cfg)).filter((n) => n !== 'home2');

const STORE_EN = ['BUY NOW', 'Your Name', 'Your Email', 'Your Phone', 'Checkout', 'Load more', 'More products'];
const results = [];
const rec = (page, ok, check, detail = '') => results.push({ page, ok, check, detail });

const get = (url, opts = {}) =>
  fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual', ...opts });

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (html, re) => (html.match(re) || [])[1] || '';

/**
 * Склеенные слова (Ф2.4). Корень — переносы через <br>/<span> БЕЗ пробела между
 * текстовыми узлами: `Картины,<br/>живущие` робот читает как «Картины,живущиев».
 * Ищем именно это: тег(и), соединяющие два словесных символа без пробела.
 * (Прошлая эвристика «CamelCase или слово ≥25 символов» этот дефект пропускала —
 *  давала зелёный на живом баге, поэтому проверяем структуру, а не результат.)
 */
const WORD = 'A-Za-zА-Яа-яЁё0-9';
function glued(innerHtml) {
  // ВАЖНО: никаких \s* — пробел вокруг тега означает, что текст читается верно
  // («Публичная <span>оферта» → «Публичная оферта», это не дефект).
  const m = innerHtml.match(new RegExp(`[${WORD},.!?:;»)]((?:<[^>]+>)+)[${WORD}«(]`));
  if (m) {
    const at = innerHtml.indexOf(m[0]);
    return `нет пробела вокруг ${m[1].trim().slice(0, 24)} → «${strip(innerHtml.slice(Math.max(0, at - 12), at + 30))}»`;
  }
  if (/[а-яё][А-ЯЁ]/.test(strip(innerHtml))) return 'строчная+ПРОПИСНАЯ подряд';
  const long = strip(innerHtml).split(/\s+/).find((w) => w.length >= 25);
  return long ? `слово ${long.length} символов: ${long.slice(0, 30)}` : '';
}

async function checkPage(name) {
  const p = cfg[name];
  const url = ORIGIN + (p.alias === '/' ? '/' : p.alias);
  let r, html;
  try {
    r = await get(url);
    html = await r.text();
  } catch (e) {
    rec(name, false, 'доступность', String(e).slice(0, 60));
    return;
  }
  rec(name, r.status === 200, 'status 200', `получено ${r.status}`);
  if (r.status !== 200) return;

  // сырой HTML заголовков — по нему видно склейку на границах тегов
  const h1raw = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1]);
  const h2raw = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
  rec(name, h1raw.length === 1, 'ровно один H1', `найдено ${h1raw.length}`);
  rec(name, h2raw.length >= 1, 'H2 ≥ 1', `найдено ${h2raw.length}`);

  const bad = [...h1raw, ...h2raw].map((t) => ({ t: strip(t), g: glued(t) })).filter((x) => x.g);
  rec(name, bad.length === 0, 'H1/H2 без склеенных слов',
    `${bad.length} шт.: ` + bad.slice(0, 2).map((x) => x.g).join(' · '));

  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
  rec(name, canonical.startsWith('https://mbezu.ru'), 'canonical https://mbezu.ru', canonical || 'отсутствует');

  const ogTitle = attr(html, /<meta[^>]+property="og:title"[^>]+content="([^"]*)"/);
  rec(name, !!ogTitle && ogTitle !== 'Blank page', 'og:title заполнен и ≠ Blank page', ogTitle || 'отсутствует');

  const ogSite = attr(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]*)"/);
  rec(name, ogSite === 'MBezu', 'og:site_name = MBezu', ogSite || 'отсутствует');

  const ogImg = attr(html, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/);
  if (!ogImg) {
    rec(name, false, 'og:image указан и отдаёт 200', 'отсутствует');
  } else {
    let st = 0;
    try { st = (await get(ogImg, { redirect: 'follow' })).status; } catch { /* сеть */ }
    rec(name, st === 200, 'og:image указан и отдаёт 200', `${ogImg.slice(0, 60)} → ${st}`);
  }

  const desc = attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/);
  const descOk = !!desc && desc.length <= 160 && !/Открытие сайта/i.test(desc) && !/^артины/.test(desc);
  rec(name, descOk, 'description непустой, ≤160, без «Открытие сайта»',
    desc ? `${desc.length} симв.: ${desc.slice(0, 48)}…` : 'отсутствует');

  // Наш русификатор Store живёт в head сайта, и его словарь содержит те самые
  // английские строки. Считать их «нерусифицированным контентом» неверно —
  // вырезаем свой блок перед проверкой, иначе проверка ловит сама себя.
  const content = html.replace(/<!--\s*MBezu · ru-store[\s\S]*?<\/script>/gi, '');
  const found = STORE_EN.filter((s) => content.includes(s));
  rec(name, found.length === 0, 'нет нерусифицированных строк Store', found.join(', '));
}

async function checkGlobal() {
  for (const [label, u] of [['http://mbezu.ru → 301', 'http://mbezu.ru/'], ['https://www.mbezu.ru → 301', 'https://www.mbezu.ru/']]) {
    let st = 0, loc = '';
    try { const r = await get(u); st = r.status; loc = r.headers.get('location') || ''; } catch (e) { loc = String(e).slice(0, 40); }
    rec('глобально', st === 301 || st === 308, label, `${st}${loc ? ' → ' + loc : ''}`);
  }

  let sm = '';
  try { sm = await (await get(`${ORIGIN}/sitemap.xml`, { redirect: 'follow' })).text(); } catch { /* нет карты */ }
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  rec('sitemap', locs.length > 0, 'sitemap.xml отдаётся', `${locs.length} URL`);
  rec('sitemap', !locs.some((l) => l.startsWith('http://')), 'нет http:// в sitemap',
    `${locs.filter((l) => l.startsWith('http://')).length} шт.`);
  for (const junk of ['/home', '/cart', '/painting/', '/page1431']) {
    const hits = locs.filter((l) => l.includes(junk));
    rec('sitemap', hits.length === 0, `нет ${junk} в sitemap`, hits.slice(0, 2).join(' '));
  }

  try {
    const html = await (await get(`${ORIGIN}/cart`, { redirect: 'follow' })).text();
    rec('/cart', /<meta[^>]+name="robots"[^>]+noindex/i.test(html), '/cart закрыт noindex',
      /name="robots"/i.test(html) ? 'robots есть, но без noindex' : 'meta robots отсутствует');
  } catch { rec('/cart', false, '/cart закрыт noindex', 'страница недоступна'); }
}

// ── Проверка, что витрина ЖИВАЯ ────────────────────────────────
// Sprint 15: всё остальное здесь ходит curl'ом без JS — и поэтому мёртвая
// витрина спокойно проходила приёмку на 54/59. Реально было так: из-за
// `export { go } from './routes'` (реэкспорт не вводит имя в модуль) React
// падал с ReferenceError, #root оставался пустым, страницы отдавали пустой
// экран — а разметка в HTML была безупречной. Проверяем в браузере: контент
// смонтирован и в консоли нет ошибок.
async function checkAlive(paths) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { rec('живость', false, 'проверка монтирования', 'playwright не установлен'); return; }

  const browser = await chromium.launch();
  try {
    for (const p of paths) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
      try {
        await page.goto(ORIGIN + p, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);
        const st = await page.evaluate(() => {
          const root = document.getElementById('root');
          return { kids: root ? root.children.length : -1, len: document.body.innerText.trim().length };
        });
        rec(p || '/', st.kids > 0 && st.len > 400, 'витрина смонтирована',
          st.kids < 0 ? '#root отсутствует' : `#root: ${st.kids} узлов, текста ${st.len} симв.`);
        rec(p || '/', errors.length === 0, 'нет ошибок в консоли', errors[0] || '');
      } catch (e) {
        rec(p || '/', false, 'витрина смонтирована', String(e).slice(0, 90));
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
}

console.log(`\n  verify-live · ${ORIGIN} · User-Agent: YandexBot · без JS\n`);
for (const n of names) { await checkPage(n); }
if (!only.length) await checkGlobal();
await checkAlive(only.length ? ['/'] : ['/', '/catalog', '/about']);

let cur = '';
for (const r of results) {
  if (r.page !== cur) { cur = r.page; console.log(`  ── ${cur}`); }
  console.log(`   ${r.ok ? '✓' : '✗'} ${r.check}${r.ok || !r.detail ? '' : `  — ${r.detail}`}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n  Итог: ${results.length - failed.length}/${results.length} пройдено, ${failed.length} провалено\n`);
if (failed.length) {
  console.log('  ПРОВАЛЕНО:');
  for (const f of failed) console.log(`   ✗ [${f.page}] ${f.check}${f.detail ? ` — ${f.detail}` : ''}`);
  console.log('');
  process.exit(1);
}
