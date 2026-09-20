// ─────────────────────────────────────────────────────────────
// store-import-session.mjs — CSV-импорт товаров в нативный Tilda Store
// через СОХРАНЁННУЮ сессию (scripts/tilda-session.mjs), без логина паролем.
//
// Отличие от старого store-import.mjs: тот логинился email+паролем на каждый прогон —
// именно это в Sprint 14 приводило к reCAPTCHA. Здесь — живой профиль браузера,
// вход руками один раз: `npm run tilda:login`.
//
// По умолчанию доходит до предпросмотра и НИЧЕГО не пишет в каталог.
//   node scripts/store-import-session.mjs                                  # сухой прогон
//   FILE=C:/MBezu/02-tilda-store-import-2026.csv CONFIRM=1 node scripts/store-import-session.mjs
//
// ⚠ Повторный импорт того же SKU дописывает дубль модификации и НЕ обновляет
//   бренд/раздел/характеристики у существующих товаров. Импортировать один раз.
// ─────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { withSession, pace, PROJECTID } from './tilda-session.mjs';

const FILE = process.env.FILE || 'C:/MBezu/02-tilda-store-import-2026.csv';
const CONFIRM = process.env.CONFIRM === '1';

if (!existsSync(FILE)) {
  console.error(`  нет файла ${FILE}`);
  process.exit(1);
}
const rows = readFileSync(FILE, 'utf-8').split(/\r?\n/).filter(Boolean);
const skus = rows.slice(1).map((r) => r.split(';')[2]).filter(Boolean);
console.log(`CSV: ${FILE}`);
console.log(`строк: ${skus.length} — ${skus.join(' ')}`);
console.log(CONFIRM ? '\n!! CONFIRM=1 — импорт будет записан в боевой каталог\n' : '\n(сухой прогон: до предпросмотра, каталог не меняется)\n');

mkdirSync('audit', { recursive: true });

await withSession(async ({ page }) => {
  await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 90000 });
  await pace(4000, 6000);

  const loggedIn = !/\/login\//.test(page.url())
    && (await page.evaluate(() => !/Авторизуйтесь|Эл\. почта\s+Пароль/i.test(document.body?.innerText || '')));
  if (!loggedIn) {
    console.error('  панель магазина не открылась (сессия протухла) — `npm run tilda:login`');
    process.exit(2);
  }
  const before = await page.evaluate(() => document.querySelectorAll('.tstore__product, [class*="tstore__product"]').length);
  console.log(`товаров на экране до импорта: ${before}`);

  // ── открыть модалку импорта и подсунуть файл ──
  // Пункт меню «⋯» физически есть в DOM, но скрыт, пока меню не раскрыто, и клик
  // по нему падал по «element is not visible». У пункта в onclick висит
  // tstore_start_import('csv') — зовём её напрямую, это тот же путь без гонки с меню.
  await page.evaluate(() => window.scrollTo(0, 0));
  const opened = await page.evaluate(() => {
    if (typeof window.tstore_start_import === 'function') { window.tstore_start_import('csv'); return 'fn'; }
    const el = [...document.querySelectorAll('.tstore__etc-btn__menu-item')]
      .find((e) => /Импортировать \(или обновить\) товары из CSV/i.test(e.innerText || ''));
    if (el) { el.click(); return 'dom'; }
    return null;
  });
  console.log('модалка импорта:', opened || 'НЕ открылась');
  if (!opened) { console.error('  не нашёл точку входа в импорт'); return; }
  await pace(2500, 3500);
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 20000 }),
    page.getByText('Загрузить файл', { exact: false }).first().click({ timeout: 10000 }),
  ]);
  await fc.setFiles(FILE);
  console.log('файл передан в форму');
  await pace(9000, 12000);
  await page.screenshot({ path: 'audit/store-import-s-loaded.png', fullPage: true }).catch(() => {});

  const preview = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 700));
  console.log('\n== предпросмотр ==\n', preview, '\n');

  if (!CONFIRM) {
    console.log('CONFIRM=1 — чтобы записать импорт.');
    return;
  }

  // ── шаг 1: подтвердить файл ──
  try { await page.getByText('Импортировать', { exact: true }).last().click({ timeout: 10000 }); }
  catch (e) { console.log('клик «Импортировать» не прошёл:', e.message.split('\n')[0]); }
  await pace(4000, 5000);
  await page.screenshot({ path: 'audit/store-import-s-step2.png', fullPage: true }).catch(() => {});

  // ── шаг 2: включить «заменить имеющиеся изображения», не включать «только обновить» ──
  const opts = await page.evaluate(() => {
    const out = { labels: [], replaceChecked: null };
    for (const c of document.querySelectorAll('input[type="checkbox"]')) {
      const lbl = (c.closest('label,div')?.innerText || '').replace(/\s+/g, ' ').trim();
      if (lbl) out.labels.push((c.checked ? '[x] ' : '[ ] ') + lbl.slice(0, 60));
      if (/заменить имеющиеся изображ/i.test(lbl)) {
        const l = c.closest('label') || c.parentElement;
        if (!c.checked && l) l.click();
        if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('click', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }
        out.replaceChecked = c.checked;
      }
    }
    return out;
  });
  console.log('опции:', JSON.stringify(opts.labels), '| заменить изображения:', opts.replaceChecked);

  await page.evaluate(() => {
    const m = document.querySelector('[class*="popup"],[class*="modal"]');
    if (m) m.scrollTop = m.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
  await pace(800, 1200);

  let finalized = null;
  const btn = page.locator('.btn_importcsv_proccess').first();
  if (await btn.count()) { await btn.click({ timeout: 8000 }); finalized = '.btn_importcsv_proccess'; }
  if (!finalized) {
    for (const label of ['Начать запись данных', 'Импортировать', 'Начать импорт', 'Применить']) {
      const loc = page.getByText(label, { exact: true });
      if (await loc.count()) { await loc.last().click({ timeout: 6000 }); finalized = label; break; }
    }
  }
  console.log('финальная кнопка:', finalized);
  if (!finalized) { console.error('  не нашёл кнопку запуска — импорт НЕ выполнен'); return; }

  // ── ждать реального завершения: «Импортировано N%» — это прогресс, а не финиш ──
  let done = false;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(4000);
    const st = await page.evaluate(() => {
      const t = document.body.innerText || '';
      const pct = (t.match(/Импортировано\s+(\d+)\s*%/i) || [])[1];
      const fin = (t.match(/(импорт (?:завершён|завершен|окончен)|готово|успешно|обновлено\s+\d+|добавлено\s+\d+|товаров обработано|ошибк[аи][^.\n]{0,80}|error)/i) || [''])[0];
      return { pct: pct ? Number(pct) : null, fin };
    });
    if (i % 3 === 0 || st.pct === 100) console.log(`  ${i * 4}с: ${st.pct ?? '—'}% ${st.fin || ''}`);
    if (st.pct === 100 || /завершён|завершен|окончен|готово|успешно|обновлено \d|добавлено \d|обработано|ошибк|error/i.test(st.fin)) { done = true; break; }
  }
  console.log('импорт завершён:', done);
  await pace(3000, 4000);
  await page.screenshot({ path: 'audit/store-import-s-result.png', fullPage: true }).catch(() => {});

  await page.reload({ waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await pace(4000, 6000);
  const after = await page.evaluate(() => document.querySelectorAll('.tstore__product, [class*="tstore__product"]').length);
  console.log(`товаров на экране после импорта: ${after} (было ${before})`);
  console.log('\nдальше: node scripts/store-map-uids.mjs  → APPLY=1 node scripts/store-map-uids.mjs');
});
