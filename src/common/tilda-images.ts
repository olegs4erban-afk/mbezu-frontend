// ─────────────────────────────────────────────────────────────
// tilda-images.ts — image adapter / resolver.
// Locally images live under /assets/works/<slug>{,@md,@sm}.jpg (served from public/).
// In a CDN/Tilda context, per-id overrides can be injected into TILDA_IMAGES.
// ─────────────────────────────────────────────────────────────

import { CARD_WIDTHS } from './card-widths';

export type ImgSize = 'thumb' | 'large' | 'full';

/**
 * ABSOLUTE CDN base — work photos are served only from GitHub Pages (cdn.mbezu.ru),
 * NOT from Tilda. When the chunks run inside a Tilda page (mbezu.ru/...), a root-relative
 * `/assets/works/...` would resolve to mbezu.ru and 404; an absolute CDN URL works on
 * both the CDN preview and live Tilda pages.
 */
export const IMAGE_BASE = 'https://cdn.mbezu.ru/assets/works';

const SUFFIX: Record<ImgSize, string> = {
  thumb: '@sm', // 320w · миниатюра
  large: '@md', // 768w · каталог
  full: '',     // 1600w · карточка работы
};

/** Build the served URL for a work slug at a given size. */
export function worksImage(slug: string, size: ImgSize): string {
  return `${IMAGE_BASE}/${slug}${SUFFIX[size]}.jpg`;
}

/**
 * Per-artwork-id override map → transparent WebP cards on the CDN.
 * Cards are square 1200×1200 transparent WebP (Sprint 8) — one file per work,
 * used at every size (thumb/large/full). Sprint 9: MN-02 «Вершина» has no card
 * (только 2 горных холста: «Перевал» 551 + «Шторм» 900) — placeholder, скрыта.
 * Single source of truth shared with the native Tilda Store (same CDN URLs via CSV import).
 */
const CARD_BASE = 'https://cdn.mbezu.ru/assets/cards';
const CARD_SLUGS = [
  'mn-01', 'mn-03', 'mn-04', 'mn-05', 'mn-06',
  'st-01', 'st-02', 'st-03', 'st-04', 'st-05', 'st-06', 'st-07', 'st-08',
  'ts-01', 'ts-02', 'ts-03', 'ts-04', 'ts-05', 'ts-06',
  'td-01', 'td-02',
  // Пополнение 2026 (NewCartym): монохром, улицы, тихая сила, тондо
  'ct-01', 'ct-02', 'ct-03', 'ct-04', 'ct-05', 'ct-06', 'ct-07', 'ct-08', 'ct-09',
  'td-03', 'td-04', 'td-05',
  // Портреты на золоте
  'pp-01', 'pp-02', 'pp-03',
  // Миниатюры (NewMini)
  'mi-01', 'mi-02', 'mi-03', 'mi-04', 'mi-05', 'mi-06',
  'mi-07', 'mi-08', 'mi-09', 'mi-10', 'mi-11', 'mi-12',
  // Партия NewContent: работы из мастерской и со стены
  'nc-01', 'nc-02', 'nc-03', 'nc-04', 'nc-05', 'nc-06', 'nc-07', 'nc-08',
];
// Sprint 15 (аудит): раньше здесь для всех трёх размеров стоял ОДИН и тот же
// файл 1200 px — из-за этого srcset не строился, и телефон качал каталог
// целиком на 1996 КБ. Уменьшенные копии делает scripts/gen-card-sizes.mjs
// (@480 — 13–36 КБ, @960 — 34–95 КБ против 100–156 КБ у оригинала).
/**
 * srcSet карточки с РЕАЛЬНЫМИ ширинами файлов.
 *
 * Раньше дескрипторы были зашиты как `480w / 960w / 1200w` для всех работ.
 * Дескриптор — это ширина файла в пикселях, а файл ограничен по ДЛИННОЙ стороне:
 * у вертикальной работы ширина 900–950 px, у миниатюр (собраны с фото сервировки) —
 * 380–700 px. Браузер верил цифрам и выбирал не тот файл.
 * Ширины считает scripts/gen-card-widths.py → card-widths.ts.
 *
 * Возвращает undefined, если у работы один файл — тогда srcSet не нужен.
 */
export function cardSrcSet(id?: string): string | undefined {
  const list = id ? CARD_WIDTHS[String(id).toUpperCase()] : undefined;
  if (!list || list.length < 2) return undefined;
  const slug = String(id).toLowerCase();
  return list.map(([suffix, w]) => `${CARD_BASE}/${slug}${suffix}.webp ${w}w`).join(', ');
}

/**
 * Sprint 16: карта строится по РЕАЛЬНО существующим файлам (card-widths.ts),
 * а не по предположению «у каждой работы есть все три размера». У семи работ
 * @960 был побайтовым дублем оригинала и удалён — прежняя карта ссылалась бы на 404.
 */
export const TILDA_IMAGES: Record<string, Partial<Record<ImgSize, string>>> =
  Object.fromEntries(
    CARD_SLUGS.map((slug) => {
      const id = slug.toUpperCase();
      const have = CARD_WIDTHS[id] || [['@480', 0], ['@960', 0], ['', 0]] as Array<[string, number]>;
      const url = (suffix: string) => `${CARD_BASE}/${slug}${suffix}.webp`;
      const smallest = have[0][0];
      const largest = have[have.length - 1][0];
      const middle = have[Math.min(1, have.length - 1)][0];
      return [id, { thumb: url(smallest), large: url(middle), full: url(largest) }];
    }),
  );
