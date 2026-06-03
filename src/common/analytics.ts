// ─────────────────────────────────────────────────────────────
// analytics.ts — Я.Метрика + GA4 + VK Pixel + UTM capture.
// ⚠ ID — ПЛЕЙСХОЛДЕРЫ. Реальные счётчики вписать перед деплоем (см. TODO-incomplete.md).
// Загрузка скриптов происходит ТОЛЬКО когда ID перестают быть плейсхолдерами.
// ─────────────────────────────────────────────────────────────

export const ANALYTICS_IDS = {
  // TODO: заменить на реальные перед деплоем
  yandexMetrika: 'XXXXXXXX',        // номер счётчика Я.Метрики
  ga4: 'G-XXXXXXXXXX',              // GA4 Measurement ID
  vkPixel: 'VK-RTRG-XXXXXX-XXXXX',  // VK Ads / Top пиксель
};

const isPlaceholder = (v: string) => !v || v.includes('X');

export interface Utm {
  source?: string; medium?: string; campaign?: string; term?: string; content?: string;
}

/** Parse UTM params from the current URL into one object, persist to sessionStorage. */
export function captureUtm(): Utm {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  (['source', 'medium', 'campaign', 'term', 'content'] as const).forEach((k) => {
    const v = q.get('utm_' + k);
    if (v) utm[k] = v;
  });
  try {
    if (Object.keys(utm).length) {
      sessionStorage.setItem('mbez-utm', JSON.stringify(utm));
    }
  } catch { /* ignore */ }
  return utm;
}

export function getUtm(): Utm {
  try {
    return JSON.parse(sessionStorage.getItem('mbez-utm') || '{}');
  } catch {
    return {};
  }
}

declare global {
  interface Window { ym?: (...a: unknown[]) => void; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; }
}

/** Init analytics. No-ops while IDs are placeholders — safe to call in every entry. */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  captureUtm();

  if (!isPlaceholder(ANALYTICS_IDS.yandexMetrika)) initYandexMetrika(ANALYTICS_IDS.yandexMetrika);
  if (!isPlaceholder(ANALYTICS_IDS.ga4)) initGa4(ANALYTICS_IDS.ga4);
  if (!isPlaceholder(ANALYTICS_IDS.vkPixel)) initVkPixel(ANALYTICS_IDS.vkPixel);

  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.info('[analytics] placeholders active — no trackers loaded. UTM:', getUtm());
  }
}

function initYandexMetrika(id: string): void {
  (function (m: any, e: any, t: any, r: any, i: any) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * (new Date() as any);
    const k = e.createElement(t); const a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  window.ym!(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}

function initGa4(id: string): void {
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
}

function initVkPixel(id: string): void {
  // Заглушка-скелет; финальный сниппет VK добавить в Phase 4 после получения ID.
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://vk.com/js/api/openapi.js?169';
  s.dataset.vkPixel = id;
  document.head.appendChild(s);
}
