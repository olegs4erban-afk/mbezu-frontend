// ─────────────────────────────────────────────────────────────
// flags.ts — переключатели, которые нужны И клиенту, И node-скриптам (prerender).
// Держим отдельно от app.tsx: тот импортирует styles.css, а Node такой импорт не понимает.
// ─────────────────────────────────────────────────────────────

/**
 * Sprint 14 (Ф6): страницы серий отрендерены и лежат на CDN
 * (/catalog/monohromnaya, ulitsy-mira, tihaya-sila, tondo), НО на mbezu.ru
 * им нужны собственные страницы Tilda — иначе /catalog/<slug> отдаёт 404.
 * Пока их нет: ссылки ведут на ?series=, а sitemap не содержит slug-URL,
 * чтобы не отправлять людей и робота в 404.
 *
 * Когда 4 страницы Tilda созданы (alias catalog/<slug> + контейнер):
 *   1) поставить true  2) npm run build  3) push  4) обновить контейнеры.
 */
export const SERIES_PAGES_LIVE = true; // Sprint 15: 4 страницы серий созданы в Tilda и живые

/** series id → url-slug. Принимает и id, и уже готовый slug. */
export function seriesSlug(idOrSlug: string): string {
  const map: Record<string, string> = {
    monochrome: 'monohromnaya', streets: 'ulitsy-mira', silence: 'tihaya-sila', tondi: 'tondo',
  };
  return map[idOrSlug] || idOrSlug;
}
