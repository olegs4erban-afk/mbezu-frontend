// ─────────────────────────────────────────────────────────────
// verify-live.mjs (Sprint 15, Ф1.3) — приёмка ПО ДОМЕНУ, а не по сборке.
//
// Урок Sprint 14: «сгенерировано в репозитории» ≠ «отдаётся доменом». Поэтому
// проверка ходит на https://mbezu.ru от имени YandexBot, БЕЗ выполнения JS,
// и падает с exit 1 при первом несоответствии. Состояние домена = тест, а не вера.
//
// Запуск:  npm run verify           (все страницы)
//          PAGES=home,catalog npm run verify
//
// 03.09 — приёмка head-кода и посадочных (всё по статичному HTML, без браузера):
//   • perf-preload (preconnect к CDN, ≥4 preload шрифтов), отложенный тег Метрики
//     (perf-metrika + mbzGo), cookie-плашка 152-ФЗ (cookie-notice + #mbezu-ck);
//   • inline-скрипт data-mbezu на <html> цел: есть setAttribute('data-mbezu','app')
//     и НЕТ «replace(//+$/» — так выглядит regex после того, как редактор head
//     Tilda вырезал обратные слэши (прошлая поломка витрины);
//   • CSS-скрытие форм-приёмников .t-rec:has(input[name="lead_ref"]);
//   • 7 посадочных: статичный JSON-LD #mbezu-ld-… с FAQPage + BreadcrumbList,
//     title ≤ 70 и description ≤ 160; title ≤ 70 — и на страницах seo/pages.json;
//   • cdn.mbezu.ru/llms.txt отвечает 200 и начинается с «# MBezu».
//   Домен за ddos-guard — между запросами держим паузу.
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
// домен за ddos-guard: серия быстрых запросов с одного адреса ловит челлендж вместо страницы
const pause = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const headOf = (html) => { const i = html.indexOf('</head>'); return i > 0 ? html.slice(0, i) : html; };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const count = (s, needle) => s.split(needle).length - 1;

// 03.09: посадочные под запросы «картина в …» и серии-подборки (статичный HTML + JSON-LD, Tilda T123)
const LANDINGS = ['/podarok', '/kartina-v-gostinuyu', '/kartina-v-spalnyu', '/kartina-v-kabinet', '/catalog/more', '/catalog/botanika', '/catalog/gory'];
// страницы вне seo/pages.json, у которых проверяем head-код сайта
const EXTRA_HEAD = ['/podarok', '/journal'];

/** Все, что живёт в head-коде сайта Tilda (tilda-head-code.mjs) — по одной проверке на блок. */
function checkHead(name, html) {
  const head = headOf(html);
  const fonts = count(head, '<link rel="preload" as="font"');
  rec(name, head.includes('<!-- MBezu · perf-preload') && fonts >= 4, 'head: perf-preload, ≥4 preload шрифтов',
    `${head.includes('<!-- MBezu · perf-preload') ? 'маркер есть' : 'маркера нет'}, preload шрифтов: ${fonts}`);
  rec(name, head.includes('<link rel="preconnect" href="https://cdn.mbezu.ru"'), 'head: preconnect к cdn.mbezu.ru', 'отсутствует');
  rec(name, head.includes('MBezu · perf-metrika') && head.includes('mbzGo'), 'head: perf-metrika, отложенный тег Метрики (mbzGo)',
    `${head.includes('MBezu · perf-metrika') ? 'маркер есть' : 'маркера нет'}, mbzGo: ${count(head, 'mbzGo')}`);
  rec(name, head.includes('MBezu · cookie-notice') && head.includes('mbezu-ck'), 'head: cookie-notice, плашка #mbezu-ck',
    `${head.includes('MBezu · cookie-notice') ? 'маркер есть' : 'маркера нет'}, mbezu-ck: ${count(head, 'mbezu-ck')}`);
  // Редактор head Tilda вырезает обратные слэши: `replace(/\/+$/` превращается в `replace(//+$/` —
  // это уже комментарий до конца строки, скрипт ломается, витрина остаётся без data-mbezu.
  const setOk = html.includes("setAttribute('data-mbezu','app')");
  const brokenRe = html.includes('replace(//+$/');
  rec(name, setOk && !brokenRe, "inline-скрипт data-mbezu цел (setAttribute есть, «replace(//+$/» нет)",
    `${setOk ? 'setAttribute есть' : 'setAttribute отсутствует'}${brokenRe ? ', найден replace(//+$/ — вырезаны слэши' : ''}`);
  rec(name, head.includes('.t-rec:has(input[name="lead_ref"])'), 'head: CSS-скрытие форм-приёмников lead_ref', 'селектор отсутствует');
}

function checkTitle(name, html) {
  const title = decode(strip(attr(html, /<title[^>]*>([\s\S]*?)<\/title>/)));
  rec(name, !!title && title.length <= 70, 'title непустой, ≤70', title ? `${title.length} симв.: ${title.slice(0, 48)}…` : 'отсутствует');
}

function checkDescr(name, html) {
  const desc = attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/);
  const descOk = !!desc && desc.length <= 160 && !/Открытие сайта/i.test(desc) && !/^артины/.test(desc);
  rec(name, descOk, 'description непустой, ≤160, без «Открытие сайта»',
    desc ? `${desc.length} симв.: ${desc.slice(0, 48)}…` : 'отсутствует');
}

/** Собрать все @type из JSON-LD (массив, @graph, вложенные сущности). */
function ldTypes(node, acc = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => ldTypes(n, acc));
  else if (node && typeof node === 'object') {
    if (typeof node['@type'] === 'string') acc.add(node['@type']);
    for (const v of Object.values(node)) if (v && typeof v === 'object') ldTypes(v, acc);
  }
  return acc;
}
function checkLanding(name, html) {
  const m = html.match(/<script[^>]*id="(mbezu-ld-[^"]*)"[^>]*>([\s\S]*?)<\/script>/);
  if (!m || !/type="application\/ld\+json"/.test(m[0])) {
    rec(name, false, 'JSON-LD #mbezu-ld-… с FAQPage + BreadcrumbList', m ? `${m[1]} без type=ld+json` : 'скрипт отсутствует');
    return;
  }
  let types = new Set(), err = '';
  try { types = ldTypes(JSON.parse(m[2])); } catch (e) { err = 'JSON.parse: ' + String(e).slice(0, 50); }
  const ok = !err && types.has('FAQPage') && types.has('BreadcrumbList');
  rec(name, ok, 'JSON-LD #mbezu-ld-… с FAQPage + BreadcrumbList', err || `${m[1]}: ${[...types].slice(0, 6).join(', ')}`);
}

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

  checkDescr(name, html);
  checkTitle(name, html);

  // Наш русификатор Store живёт в head сайта, и его словарь содержит те самые
  // английские строки. Считать их «нерусифицированным контентом» неверно —
  // вырезаем свой блок перед проверкой, иначе проверка ловит сама себя.
  const content = html.replace(/<!--\s*MBezu · ru-store[\s\S]*?<\/script>/gi, '');
  // 03.09: кнопка «Load more» скрытого нативного каталога (#rec2291453131, display:none) — текст по умолчанию Tilda,
  // поля для него нет; на живой странице его подменяет русификатор. Не считаем.
  const content2 = content.split('js-store-load-more-btn-text">Load more<').join('js-store-load-more-btn-text"><');
  const found = STORE_EN.filter((s) => content2.includes(s));
  rec(name, found.length === 0, 'нет нерусифицированных строк Store', found.join(', '));

  checkHead(name, html);
}

// 03.09: страницы вне seo/pages.json — head-код сайта на /podarok и /journal,
// JSON-LD + длины title/description на семи посадочных. Один запрос на страницу.
async function checkExtras() {
  const paths = [...new Set([...EXTRA_HEAD, ...LANDINGS])];
  for (const p of paths) {
    await pause();
    let r, html;
    try {
      r = await get(ORIGIN + p);
      html = await r.text();
    } catch (e) {
      rec(p, false, 'доступность', String(e).slice(0, 60));
      continue;
    }
    rec(p, r.status === 200, 'status 200', `получено ${r.status}`);
    if (r.status !== 200) continue;
    if (EXTRA_HEAD.includes(p)) checkHead(p, html);
    if (LANDINGS.includes(p)) {
      checkLanding(p, html);
      checkTitle(p, html);
      checkDescr(p, html);
    }
  }
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

  // 03.09: llms.txt для ИИ-поисковиков лежит на CDN витрины
  await pause();
  try {
    const r = await get('https://cdn.mbezu.ru/llms.txt', { redirect: 'follow' });
    const txt = await r.text();
    rec('llms.txt', r.status === 200 && txt.startsWith('# MBezu'), 'cdn.mbezu.ru/llms.txt → 200, начинается с «# MBezu»',
      `${r.status}, начало: ${JSON.stringify(txt.slice(0, 24))}`);
  } catch (e) { rec('llms.txt', false, 'cdn.mbezu.ru/llms.txt → 200, начинается с «# MBezu»', String(e).slice(0, 60)); }
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
for (const n of names) { await pause(); await checkPage(n); }
if (!only.length) { await checkExtras(); await checkGlobal(); }
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
