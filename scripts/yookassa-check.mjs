// YooKassa readiness checklist (read-only) across live mbezu.ru.
// Verifies the mandatory public elements + reports what's missing.
import { chromium } from 'playwright';
const B = 'https://mbezu.ru';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });

async function textOf(path, waitRoot = true) {
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  if (waitRoot) await p.waitForFunction(() => document.getElementById('root')?.children.length > 0, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({
    body: document.body.innerText || '',
    root: document.getElementById('root')?.innerText || '',
    has706: !!document.querySelector('[data-record-type="706"]'),
    has776: !!document.querySelector('[data-record-type="776"]'),
    rubCount: (document.body.innerText.match(/₽|\dр\.|\d\sр\.|руб/gi) || []).length,
    title: document.title,
    bodySample: (document.body.innerText || '').slice(0, 220).replace(/\n+/g, ' | '),
  }));
  await p.close();
  return r;
}
const has = (s, ...terms) => terms.every((t) => s.includes(t));
const any = (s, ...terms) => terms.some((t) => s.includes(t));

const legal = await textOf('/legal');
const root = await textOf('/', false);
const catalog = await textOf('/catalog', false);
const cart = await textOf('/cart', false);

const checks = [
  ['Оферта', any(legal.root + legal.body, 'Оферт', 'оферт', 'публичн')],
  ['Политика ПД (152-ФЗ)', any(legal.root + legal.body, 'персональн', '152-ФЗ', 'Политик')],
  ['Доставка / оплата', any(legal.root + legal.body, 'Доставк', 'доставк', 'оплат')],
  ['Возврат', any(legal.root + legal.body, 'Возврат', 'возврат')],
  ['Реквизиты ИП (ИНН/ОГРНИП)', has(legal.root + legal.body, 'ИНН') && any(legal.root + legal.body, 'ОГРНИП', 'ОГРН')],
  ['ИП ФИО (Клевер)', any(legal.root + legal.body, 'Клевер')],
  ['Контакты (email/тел)', any(legal.body + root.body, '@') && /\+?\d[\d \-()]{8,}/.test(legal.body + root.body)],
  ['Каталог: товары + цены (₽)', catalog.rubCount >= 3],
  ['Каталог нативный (776)', catalog.has776],
  ['Корзина нативная (706) site-wide', legal.has706 && cart.has706],
  ['Cart/checkout страница открывается', cart.title.length > 0 && (cart.has706)],
];
console.log('=== YooKassa readiness (mbezu.ru) ===');
let miss = 0;
for (const [name, ok] of checks) { console.log(`  [${ok ? '✓' : '✗'}] ${name}`); if (!ok) miss++; }
console.log(`\nroot / title: ${JSON.stringify(root.title)} | React #root rendered: ${root.root.length > 0}`);
console.log(`root / body sample: ${root.bodySample}`);
console.log(`catalog price-markers: ${catalog.rubCount} | 776:${catalog.has776} 706:${catalog.has706}`);
console.log(miss === 0 ? 'CHECKLIST: all present' : `CHECKLIST: ${miss} item(s) missing`);
await browser.close();
