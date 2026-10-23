// ─────────────────────────────────────────────────────────────
// gen-products-seo.tsx — seo_title / seo_descr товаров Tilda Store из data.ts.
//
//   node --import tsx scripts/gen-products-seo.tsx [ID ...] > out.json
//
// Шаблон тот же, что у первых 22 товаров (Sprint 15, store-fleet-map.json), —
// чтобы все карточки магазина читались одинаково:
//   title: «{Название} — картина маслом, {Ш×В | ⌀D} см, купить | Mila Bezú»
//   descr: «{первая фраза описания}. Оригинал маслом, {размер}, {цена} ₽.
//           Сертификат подлинности, доставка по РФ.» (≤ 160 знаков;
//           длиннее — «Авторская картина маслом «…», размер, цена. Единственный экземпляр…»)
// Проданные портреты питомцев (commission) — как пример услуги, без цены.
// Факты — только из data.ts; адрес товара — из store-urls.ts.
// ─────────────────────────────────────────────────────────────
import { ARTWORKS, dimsLabel, formatPrice } from '../src/common/data';
import { STORE_PRODUCT_PATH } from '../src/common/store-urls';

const ids = process.argv.slice(2);
const pick = (ARTWORKS as any[]).filter((a) => !a.hidden && (!ids.length || ids.includes(a.id)));

const MAX_T = 70;
const MAX_D = 160;

function firstSentence(s: string): string {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  const i = t.indexOf('. ');
  return (i > 0 ? t.slice(0, i) : t).replace(/[.\s]+$/, '');
}

const out = pick.map((a) => {
  const dims = dimsLabel(a);            // «60×80 см» / «⌀ 40 см»
  // Intl ставит неразрывные пробелы (U+00A0 / U+202F) — в SEO-полях обычные, как у первых 22 товаров
  const price = formatPrice(a.price).replace(/[\u00a0\u202f]/g, ' ');   // «85 000 ₽»
  const lead = firstSentence(a.description);
  let title: string;
  let descr: string;
  if (a.commission) {
    title = `${a.title} — портрет питомца на заказ, масло и поталь | Mila Bezú`;
    descr = `${lead}. Пример портрета на заказ: ${dims}, масло и поталь. Такой портрет вашего питомца можно заказать.`;
    if (descr.length > MAX_D) descr = `${a.title} — пример портрета на заказ: ${dims}, масло и поталь. Такой портрет вашего питомца можно заказать.`;
  } else {
    title = `${a.title} — картина маслом, ${dims}, купить | Mila Bezú`;
    descr = `${lead}. Оригинал маслом, ${dims}, ${price}. Сертификат подлинности, доставка по РФ.`;
    if (descr.length > MAX_D) descr = `Авторская картина маслом «${a.title}», ${dims}, ${price}. Единственный экземпляр, сертификат подлинности, доставка по РФ.`;
  }
  if (title.length > MAX_T) title = title.replace(' | Mila Bezú', '');
  const path = STORE_PRODUCT_PATH[a.id] || '';
  const uid = (path.match(/tproduct\/(\d+)-/) || [])[1] || '';
  return { id: a.id, uid, url: path, seo_title: title, seo_descr: descr, title_len: title.length, descr_len: descr.length };
});

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
