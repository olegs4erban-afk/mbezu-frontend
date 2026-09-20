// ─────────────────────────────────────────────────────────────
// gen-store-csv.mjs — CSV для импорта товаров в нативный Tilda Store.
//
// Формат колонок взят 1:1 из 02-tilda-store-import-v4.csv (Sprint 8).
// Источник данных — src/common/data.ts, картинки — cdn.mbezu.ru/assets/cards.
//
//   node --import tsx scripts/gen-store-csv.mjs                 → все работы
//   node --import tsx scripts/gen-store-csv.mjs CT- MI- PP- NC- TD-03 TD-04 TD-05   → пополнение 2026
//
// ⚠ ВАЖНО (журнал, sprint-8): повторный импорт УЖЕ существующего SKU дописывает
//    дубль модификации, а Brand/раздел/характеристики у существующих не обновляет.
//    Поэтому выгружай только НОВЫЕ SKU и импортируй их один раз.
// ─────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';

const { ARTWORKS, SERIES } = await import('../src/common/data.ts');
const { STORE_PRODUCT_PATH } = await import('../src/common/store-urls.ts');

const COLS = [
  'Brand', 'Title', 'SKU', 'Price', 'Currency', 'Quantity', 'Categories', 'Description',
  'Photo', 'External ID', 'Text', 'UID', 'Tags', 'Editions', 'Modifications',
  'Characteristics:Серия', 'Characteristics:Техника', 'Characteristics:Размер',
  'Characteristics:Форма', 'Characteristics:Страна', 'Characteristics:Год',
  'Characteristics:Ориентация', 'Characteristics:Подпись', 'Characteristics:Сертификат',
];

const CARD = 'https://cdn.mbezu.ru/assets/cards';

// Разделы в нативном Store названы иначе, чем серии на витрине (Sprint 8).
// Новые товары должны попасть в СУЩЕСТВУЮЩИЕ разделы, иначе Tilda заведёт дубли.
const STORE_CATEGORY = {
  monochrome: 'Монохромная',
  streets: 'Улицы мира и других стран',
  silence: 'Тихая сила',
  tondi: 'Тондо',
  mini: 'Миниатюры',            // новый раздел
  pets: 'Портреты на золоте',   // новый раздел
};

const orientation = (a) => {
  if (a.shape === 'round') return 'Круг';
  if (a.shape === 'oval') return 'Овал';
  if (a.w === a.h) return 'Квадрат';
  return a.w > a.h ? 'Горизонтальная' : 'Вертикальная';
};
const sizeTag = (a) => {
  const m = Math.max(a.w, a.h);
  if (m <= 16) return 'mini';
  if (m <= 35) return 'small';
  if (m <= 65) return 'medium';
  return 'large';
};
const shapeTag = (a) =>
  a.shape === 'round' ? 'round' : a.shape === 'oval' ? 'oval'
    : a.w === a.h ? 'square' : a.w > a.h ? 'horizontal' : 'vertical';

const dims = (a) => (a.shape === 'round' ? `⌀ ${a.w} см` : `${a.w}×${a.h} см`);

/** Торговое описание: сюжет + материал + размер + что входит в комплект. */
const description = (a, s) => {
  const parts = [
    a.description.replace(/\s+/g, ' ').trim(),
    `${a.medium}, ${dims(a)}, ${a.year} г.`,
    'Единственный экземпляр.',
  ];
  if (a.commission) {
    parts.push('Работа в частной коллекции — показана как пример направления. '
      + 'Портрет вашего питомца пишется на заказ, срок 3–5 недель.');
  } else {
    parts.push('Авторская подпись, фирменный сертификат подлинности и открытка из мастерской.');
  }
  if (a.series === 'mini') parts.push('В комплекте — деревянный мольберт-подставка.');
  return parts.join(' ');
};

const esc = (v) => String(v ?? '').replace(/[;\r\n]+/g, ' ').trim();

const want = process.argv.slice(2);
const match = (a) => !want.length || want.some((w) => a.id.startsWith(w.toUpperCase()));

const rows = ARTWORKS.filter((a) => !a.hidden && match(a)).map((a) => {
  const s = SERIES.find((x) => x.id === a.series) || {};
  const slug = a.id.toLowerCase();
  return [
    'MBezu',
    a.subtitle ? `${a.title}. ${a.subtitle}` : a.title,
    a.id,
    a.price,
    'RUB',
    a.status === 'available' ? 1 : 0,
    STORE_CATEGORY[a.series] || s.title || '',
    description(a, s),
    `${CARD}/${slug}.webp`,
    slug,
    '',
    slug,
    [a.featured ? 'featured' : '', sizeTag(a), shapeTag(a), a.commission ? 'commission' : '']
      .filter(Boolean).join(','),
    '1/1',
    '',
    s.title || '',
    a.medium,
    dims(a),
    a.shape === 'round' ? 'Круглая (тондо)' : a.shape === 'oval' ? 'Овальная (тондо)' : '',
    '',
    String(a.year),
    orientation(a),
    'Да',
    'Да',
  ].map(esc).join(';');
});

const already = rows
  .map((r) => r.split(';')[2])
  .filter((sku) => STORE_PRODUCT_PATH[sku]);

const out = `../02-tilda-store-import-2026.csv`;
writeFileSync(out, '﻿' + [COLS.join(';'), ...rows].join('\r\n') + '\r\n', 'utf-8');
console.log(`${out}: ${rows.length} SKU`);
if (already.length) {
  console.log(`  ⚠ уже есть в Store (импорт создаст дубль модификации): ${already.join(', ')}`);
}
