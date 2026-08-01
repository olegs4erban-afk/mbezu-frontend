// ─────────────────────────────────────────────────────────────
// price-audit.mjs (Sprint 15, §5) — READ-ONLY таблица расхождений цен.
// Три слоя: витрина (data.ts) / страница товара Store / корзина (tcart).
// НИЧЕГО не правит. Эталон — sprint8-master-table.md (цена = bizar).
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const src = readFileSync('src/common/data.ts', 'utf-8');
const store = JSON.parse(readFileSync('src/common/store-urls.ts', 'utf-8').match(/\{[\s\S]*?\}/)[0]
  .replace(/'/g, '"').replace(/,(\s*})/g, '$1'));

// витрина: id → {title, price, hidden}
const shop = {};
for (const m of src.matchAll(/id:\s*'([A-Z]{2}-\d{2})',\s*title:\s*'([^']+)'[\s\S]{0,700}?price:\s*(\d+)/g)) {
  const tail = src.slice(m.index, m.index + 900);
  shop[m[1]] = { title: m[2], price: Number(m[3]), hidden: /hidden:\s*true/.test(tail) };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const browser = await chromium.launch();
const rows = [];

for (const [sku, path] of Object.entries(store)) {
  const s = shop[sku];
  // ⚠️ Отдельный контекст на КАЖДЫЙ товар: корзина Tilda живёт в localStorage и
  // копится между страницами. С общим контекстом я читал строку первого товара
  // и получал «расхождение» у всех 21 — артефакт замера, а не факт.
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  let product = null, cart = null, title = '';
  try {
    await page.goto('https://mbezu.ru' + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2200);
    const r = await page.evaluate(() => {
      const el = document.querySelector('.js-product-price, .t-store__prod-popup__price-value, .t-store__prod-popup__price');
      const t = document.querySelector('.js-product-name, .t-store__prod-popup__name');
      return { price: el ? Number((el.innerText || '').replace(/[^\d]/g, '')) : null, title: (t?.innerText || '').trim() };
    });
    product = r.price; title = r.title;
    // корзина: кладём товар и читаем строку
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('a,button')].find((e) => /buy now|купить|в корзину/i.test(e.innerText || ''));
      b && b.click();
    });
    await page.waitForTimeout(2500);
    cart = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.t706__product')];
      if (items.length !== 1) return { err: `товаров в корзине: ${items.length}` };
      const p = items[0].querySelector('.t706__product-amount, .t706__product-price');
      const name = (items[0].querySelector('.t706__product-title')?.innerText || '').split('\n')[0].trim();
      return { price: Number((p?.innerText || '').replace(/[^\d]/g, '')) || null, name };
    });
  } catch { /* страница недоступна */ }
  await page.close();
  await ctx.close();
  const cartName = cart?.name || '';
  cart = cart?.err ? null : (cart?.price ?? null);

  const vals = [s?.price ?? null, product, cart].filter((v) => v != null);
  const совпало = vals.length === 3 && new Set(vals).size === 1;
  rows.push({ sku, title: s?.title || title, hidden: !!s?.hidden, shop: s?.price ?? null, product, cart, совпало });
  console.log(`${sku}  витрина=${String(s?.price ?? '—').padStart(7)}  товар=${String(product ?? '—').padStart(7)}  корзина=${String(cart ?? '—').padStart(7)}  ${совпало ? 'ok' : '*** РАСХОЖДЕНИЕ'}${s?.hidden ? ' (скрыта на витрине)' : ''}`);
}
await browser.close();

const bad = rows.filter((r) => !r.совпало);
const md = [
  '# Таблица цен — витрина / товар Store / корзина (read-only, Sprint 15 §5)',
  '',
  `Снято: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · эталон — sprint8-master-table.md (цена = bizar)`,
  '',
  '| SKU | Работа | Витрина (data.ts) | Товар Store | Корзина | Статус |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.sku} | ${r.title}${r.hidden ? ' *(скрыта)*' : ''} | ${r.shop ?? '—'} | ${r.product ?? '—'} | ${r.cart ?? '—'} | ${r.совпало ? '✓ совпадает' : '**расхождение**'} |`),
  '',
  `**Итог: ${rows.length - bad.length} из ${rows.length} совпадают.**`,
  bad.length ? `Расхождения: ${bad.map((b) => b.sku).join(', ')} — правки только после подтверждения Олега.` : 'Расхождений нет — править нечего.',
  '',
].join('\n');
writeFileSync('audit/s15-price-table.md', md, 'utf-8');
console.log(`\nИтог: ${rows.length - bad.length}/${rows.length} совпадают · таблица → audit/s15-price-table.md`);
