// ─────────────────────────────────────────────────────────────
// store-fleet-fix.mjs — массовая правка 22 товаров Store через API панели.
// Карта: scripts/store-fleet-map.json (генерится из data.ts — эталон витрины).
//
// Целевое состояние каждого товара (решение Sprint 15 после инцидента с editions):
//   • editions = [] — у единственных экземпляров вариантов НЕТ; это разом
//     убирает клонов «4 варианта» (овербукинг) и дубли в галерее;
//   • price из data.ts (s15-аудит подтвердил равенство data.ts == Store);
//   • quantity = 1 (без вариантов поле работает на уровне товара — проверено);
//   • brand = Mila Bezú; descr 380-470 зн.; seo_title/seo_descr — шаблон;
//   • gallery = ПЕРВЫЙ файл; для «Некуда спешить» — принудительно колонны
//     (st-08-md.jpg: контент файлов на tildacdn перепутан крест-накрест).
//   • title — только 5 переименований к имени витрины (Tilda ставит 301).
// ─────────────────────────────────────────────────────────────
import { withSession } from './tilda-session.mjs';
import { getProduct, saveProduct } from './store-api.mjs';
import { readFileSync } from 'node:fs';

const MAP = JSON.parse(readFileSync('scripts/store-fleet-map.json', 'utf8'));
const COLUMNS = 'https://static.tildacdn.com/tild3261-3339-4331-b566-353039303165/st-08-md.jpg';
const pace = (a = 2500, b = 4200) => new Promise((r) => setTimeout(r, a + Math.random() * (b - a)));

await withSession(async ({ page }) => {
  await page.goto('https://store.tilda.ru/store/?projectid=13712449', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  let ok = 0, fail = 0;
  for (const [uid, m] of Object.entries(MAP)) {
    try {
      const after = await saveProduct(page, uid, (j) => {
        if (m.title) j.title = m.title;
        j.descr = m.descr;
        j.price = m.price;
        j.quantity = '1';
        j.editions = [];
        j.brand = 'Mila Bezú';
        j.seo_title = m.seo_title;
        j.seo_descr = m.seo_descr;
        let gal = [];
        try { gal = typeof j.gallery === 'string' ? JSON.parse(j.gallery || '[]') : (j.gallery || []); } catch { gal = []; }
        if (uid === '771318224293') gal = [{ img: COLUMNS }];
        else if (gal.length > 1) gal = [gal[0]];
        j.gallery = JSON.stringify(gal);
      });
      const eds = after.editions ? JSON.parse(after.editions) : [];
      const good = String(after.brand) === 'Mila Bezú' && String(after.quantity) === '1' && eds.length === 0
        && String(after.descr).length > 300;
      console.log(`  ${good ? '✓' : '✗'} ${m.id} ${uid} price=${after.price} qty=${after.quantity} eds=${eds.length} descr=${String(after.descr).length}`);
      good ? ok++ : fail++;
    } catch (e) {
      console.log(`  ✗ ${m.id} ${uid} ОШИБКА: ${String(e).slice(0, 90)}`);
      fail++;
    }
    await pace();
  }
  console.log(`\nИТОГ: ok=${ok} fail=${fail}`);
});
