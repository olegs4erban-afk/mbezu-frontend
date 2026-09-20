// ─────────────────────────────────────────────────────────────
// store-map-uids.mjs — пересобрать STORE_PRODUCT_PATH в src/common/store-urls.ts
// по РЕАЛЬНОМУ составу нативного Tilda Store.
//
// Зачем: после CSV-импорта Tilda сама раздаёт товарам uid и slug
// (/catalog/tproduct/<uid>-<slug>). Руками переписывать 35 строк — гарантированная опечатка.
//
// Два источника, в порядке надёжности:
//   1. Панель магазина (нужна живая сессия, `npm run tilda:login`).
//      Там у каждой строки товара есть data-store-product-uid и артикул —
//      пара «SKU → uid» берётся точно и сразу после импорта.
//   2. Публичный /sitemap-store.xml — работает без авторизации, но обновляется
//      не мгновенно: свежеимпортированных товаров там какое-то время нет.
//      Id работы в этом режиме берётся из og:image (наша карточка .../cards/<slug>.webp).
//
// Канонический slug Tilda генерит сама из названия. Мы его не угадываем:
// любой slug при том же uid отдаёт 301 на канонический — по нему и записываем.
//
//   node scripts/store-map-uids.mjs             # показать расхождения, ничего не писать
//   APPLY=1 node scripts/store-map-uids.mjs     # переписать store-urls.ts
//   SOURCE=sitemap node scripts/store-map-uids.mjs   # принудительно без авторизации
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.env.APPLY === '1';
const SOURCE = process.env.SOURCE || 'admin';
const ORIGIN = process.env.ORIGIN || 'https://mbezu.ru';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' };
const FILE = 'src/common/store-urls.ts';

const get = async (u, opts = {}) => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: UA, ...opts });
      if (r.ok || r.status === 301 || r.status === 302) return r;
      if (r.status === 404) return r;
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 1200 * (i + 1)));
  }
  return null;
};

/** Канонический путь товара по uid: любой slug → 301 на правильный. */
async function canonicalPath(uid) {
  const r = await get(`${ORIGIN}/catalog/tproduct/${uid}-x`, { redirect: 'manual' });
  if (!r) return null;
  const loc = r.headers.get('location');
  if (loc) return loc.replace(/^https?:\/\/[^/]+/, '');
  if (r.status === 200) return `/catalog/tproduct/${uid}-x`;
  return null;
}

const found = new Map();   // ID работы → путь
const unknown = [];

if (SOURCE === 'admin') {
  const { withSession, pace, PROJECTID } = await import('./tilda-session.mjs');
  const pairs = await withSession(async ({ page }) => {
    await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 90000 });
    await pace(5000, 7000);
    return page.evaluate(() => [...document.querySelectorAll('[data-store-product-uid].js-product')].map((el) => {
      const uid = el.getAttribute('data-store-product-uid');
      const text = (el.innerText || '').replace(/\s+/g, ' ');
      const sku = (text.match(/\b(?:MN|ST|TS|TD|CT|MI|PP|NC)-\d{2}\b/) || [])[0] || '';
      return { uid, sku, title: text.slice(0, 60) };
    }));
  });
  console.log(`товаров в панели: ${pairs.length}`);
  for (const p of pairs) {
    if (!p.sku) { unknown.push({ path: `uid ${p.uid}`, title: p.title }); continue; }
    const path = await canonicalPath(p.uid);
    if (!path) { unknown.push({ path: `uid ${p.uid}`, title: p.title + ' (URL не открылся)' }); continue; }
    if (found.has(p.sku)) console.warn(`  ⚠ ДУБЛЬ ${p.sku}: ${found.get(p.sku)} и ${path}`);
    else found.set(p.sku, path);
    await new Promise((r) => setTimeout(r, 200));
  }
} else {
  const sm = await get(`${ORIGIN}/sitemap-store.xml`);
  const xml = sm ? await sm.text() : '';
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes('/tproduct/'));
  if (!urls.length) { console.error('  /sitemap-store.xml пуст или недоступен'); process.exit(1); }
  console.log(`товаров в sitemap: ${urls.length}`);
  for (const u of urls) {
    const r = await get(u);
    const html = r ? await r.text() : '';
    const og = (html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i) || [])[1] || '';
    let slug = (og.match(/\/cards\/([a-z]{2}-\d{2})[-.@]/) || [])[1];
    if (!slug) slug = (html.match(/externalid"?\s*[:=]\s*"?([a-z]{2}-\d{2})\b/i) || [])[1];
    const path = u.replace(/^https?:\/\/[^/]+/, '');
    if (slug) {
      const id = slug.toUpperCase();
      if (found.has(id)) console.warn(`  ⚠ ДУБЛЬ ${id}: ${found.get(id)} и ${path}`);
      else found.set(id, path);
    } else {
      unknown.push({ path, title: ((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '').trim().slice(0, 60) });
    }
    await new Promise((res) => setTimeout(res, 250));
  }
}

// ── сверка с витриной ────────────────────────────────────────
const dataSrc = readFileSync('src/common/data.ts', 'utf-8');
const shop = [...dataSrc.matchAll(/^\s{4}id: '([A-Z]{2}-\d{2})'/gm)].map((m) => m[1]);
const hidden = new Set(
  [...dataSrc.matchAll(/id: '([A-Z]{2}-\d{2})'[\s\S]{0,900}?hidden:\s*true/g)].map((m) => m[1]),
);
const missing = shop.filter((id) => !found.has(id) && !hidden.has(id));
const extra = [...found.keys()].filter((id) => !shop.includes(id));

console.log(`\nсопоставлено: ${found.size}`);
if (missing.length) console.log(`нет в Store (${missing.length}): ${missing.join(' ')}`);
if (extra.length) console.log(`есть в Store, но не в data.ts: ${extra.join(' ')}`);
if (unknown.length) {
  console.log(`артикул не определился (${unknown.length}):`);
  for (const u of unknown) console.log(`   ${u.path}  «${u.title}»`);
}

// ── перезапись карты ─────────────────────────────────────────
const src = readFileSync(FILE, 'utf-8');
const prev = Object.fromEntries(
  [...src.matchAll(/'([A-Z]{2}-\d{2})':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);
// Товар, который в панели не виден (или артикул пуст), не должен молча пропасть из карты.
for (const [id, path] of Object.entries(prev)) if (!found.has(id)) found.set(id, path);

const body = [...found.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, path]) => `  '${id}': '${path}',`)
  .join('\n');
const next = src.replace(
  /export const STORE_PRODUCT_PATH: Record<string, string> = \{[\s\S]*?\n\};/,
  `export const STORE_PRODUCT_PATH: Record<string, string> = {\n${body}\n};`,
);
if (next === src && Object.keys(prev).length !== found.size) {
  console.error('\n  не нашёл блок STORE_PRODUCT_PATH — файл не тронут');
  process.exit(1);
}

const before = Object.keys(prev).length;
console.log(`\nкарта: ${before} → ${found.size} записей`);
const changed = [...found.entries()].filter(([id, p]) => prev[id] !== p);
for (const [id, p] of changed) console.log(`  ${prev[id] ? '~' : '+'} ${id} → ${p}`);
if (!APPLY) { console.log('\nAPPLY=1 — чтобы записать.'); process.exit(0); }
if (found.size < before) {
  console.error(`  записей стало МЕНЬШЕ (${before} → ${found.size}) — не переписываю.`);
  process.exit(1);
}
writeFileSync(FILE, next, 'utf-8');
console.log(`✓ ${FILE} обновлён`);
