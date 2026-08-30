// ─────────────────────────────────────────────────────────────
// reviews.ts (Sprint 15) — данные системы отзывов.
//
// ⚠️ ТОЛЬКО реальные отзывы реальных покупателей. Выдуманные отзывы
// с несуществующими людьми сюда не кладутся — это решение зафиксировано
// с Олегом. Пока список пуст, секции показывают честное приглашение
// оставить первый отзыв; Review/AggregateRating-разметка появляется
// автоматически только когда здесь есть хотя бы одна запись.
//
// Новый отзыв приходит заявкой во Входящие Tilda (source=review) —
// после проверки переносится сюда руками: одна запись — один объект.
// ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;            // произвольный стабильный id, напр. 'r-2026-001'
  name: string;          // имя покупателя (как разрешил публиковать)
  city?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;          // ISO, напр. '2026-09-02'
  productId?: string;    // артикул из каталога (MN-01 …), если отзыв о конкретной работе
}

export const REVIEWS: Review[] = [
  // пока пусто — см. шапку файла
];

export function reviewsFor(productId?: string): Review[] {
  if (!productId) return REVIEWS;
  return REVIEWS.filter((r) => r.productId === productId);
}

export function averageRating(list: Review[] = REVIEWS): number {
  if (!list.length) return 0;
  return Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;
}
