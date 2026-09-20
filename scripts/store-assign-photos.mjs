// ─────────────────────────────────────────────────────────────
// store-assign-photos.mjs — привязать карточки работ к товарам нативного Store.
//
// Зачем. CSV-импорт колонку Photo не применил: у 35 новых товаров gallery пустая,
// на витрине Tilda они выглядят как товар без фото. Поле gallery хранит ВНЕШНИЙ
// URL как есть (`[{"img":"https://cdn.mbezu.ru/assets/cards/mn-01.webp"}]`),
// Tilda картинку к себе не копирует — значит достаточно записать ссылку.
//
// Источник ссылок — src/common/tilda-images.ts (тот же, что у витрины), так что
// фото в Store и в React-каталоге не разъедутся.
//
//   node scripts/store-assign-photos.mjs            # показать план
//   APPLY=1 node scripts/store-assign-photos.mjs    # применить
// ─────────────────────────────────────────────────────────────
import { withSession, pace, PROJECTID } from './tilda-session.mjs';
import { getProduct, saveProduct } from './store-api.mjs';

const APPLY = process.env.APPLY === '1';
const { TILDA_IMAGES } = await import('../src/common/tilda-images.ts');

await withSession(async ({ page }) => {
  await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 90000 });
  await pace(4000, 6000);

  const rows = await page.evaluate(() => [...document.querySelectorAll('[data-store-product-uid].js-product')].map((el) => ({
    uid: el.getAttribute('data-store-product-uid'),
    sku: ((el.innerText || '').match(/\b(?:MN|ST|TS|TD|CT|MI|PP|NC)-\d{2}\b/) || [])[0] || '',
  })));
  console.log(`товаров в панели: ${rows.length}`);

  const plan = [];
  for (const r of rows) {
    const j = await getProduct(page, r.uid);
    // у части товаров Sprint 8 артикул пуст — id работы берём из externalid
    const id = (r.sku || String(j.externalid || '')).toUpperCase();
    const want = (TILDA_IMAGES[id] || {}).full;
    if (!want) { console.log(`  ? ${id || r.uid}: нет карточки в tilda-images`); continue; }
    // Tilda отдаёт gallery как JSON-строку с экранированными слэшами
    // (`https:\/\/cdn...`) — без нормализации сравнение всегда ложно,
    // и повторный прогон переписывал все товары подряд.
    const cur = String(j.gallery || '').split('\\/').join('/');
    if (cur.includes(want)) continue;
    plan.push({ uid: r.uid, id, want, had: !!cur });
    await new Promise((res) => setTimeout(res, 110));
  }

  console.log(`\nк изменению: ${plan.length}`);
  for (const p of plan) console.log(`  ${p.id}: ${p.had ? 'заменить' : 'поставить'} ${p.want}`);
  if (!APPLY) { console.log('\nAPPLY=1 — чтобы применить.'); return; }

  let ok = 0;
  for (const p of plan) {
    try {
      await saveProduct(page, p.uid, (j) => { j.gallery = JSON.stringify([{ img: p.want }]); });
      ok++;
      if (ok % 10 === 0) console.log(`  … ${ok}/${plan.length}`);
    } catch (e) {
      console.log(`  ✗ ${p.id}: ${e.message.slice(0, 120)}`);
    }
    await new Promise((res) => setTimeout(res, 350));
  }
  console.log(`\n✓ фото проставлено: ${ok}/${plan.length}`);
});
