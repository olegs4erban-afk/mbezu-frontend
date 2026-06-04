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
 * Optional per-artwork-id override map. Empty by default.
 * Prod/Tilda can populate this with absolute CDN URLs without touching data.ts:
 *   TILDA_IMAGES['MN-01'] = { full: 'https://static.tildacdn.com/.../mn-01.jpg', ... }
 */
export const TILDA_IMAGES: Record<string, Partial<Record<ImgSize, string>>> = {};
