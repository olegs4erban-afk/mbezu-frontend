// ─────────────────────────────────────────────────────────────
// tilda-images.ts — image adapter / resolver.
// Locally images live under /assets/works/<slug>{,@md,@sm}.jpg (served from public/).
// In a CDN/Tilda context, per-id overrides can be injected into TILDA_IMAGES.
// ─────────────────────────────────────────────────────────────

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
];
export const TILDA_IMAGES: Record<string, Partial<Record<ImgSize, string>>> =
  Object.fromEntries(
    CARD_SLUGS.map((slug) => {
      const url = `${CARD_BASE}/${slug}.webp`;
      return [slug.toUpperCase(), { thumb: url, large: url, full: url }];
    }),
  );
