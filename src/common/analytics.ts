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

/** Поля utm_* в том виде, в каком их ждёт скрытая форма A Tilda (имена инпутов). */
export interface UtmFields {
  utm_source: string; utm_medium: string; utm_campaign: string; utm_term: string; utm_content: string;
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;
/** Метки текущего визита (как и раньше). */
const UTM_SESSION_KEY = 'mbez-utm';
/**
 * Аудит 21.10 (P0): home.tsx и commission.tsx читали localStorage['mbezu-utm'] с ключами
 * utm_*, а писали сюда только в sessionStorage['mbez-utm'] с ключами source/medium… —
 * ни одна заявка не несла источник. Теперь ЕДИНСТВЕННЫЙ источник — этот модуль:
 * captureUtm() пишет в оба хранилища, страницы берут getUtmFields().
 * Копия в localStorage — в формате utm_*: переживает новую вкладку и переход между
 * страницами (у Tilda и витрины разные документы, sessionStorage на вкладку).
 */
const UTM_LOCAL_KEY = 'mbezu-utm';

/** Utm → поля формы (пустые строки по умолчанию: sendLead() пустые значения не заполняет). */
function toUtmFields(u: Utm): UtmFields {
  return {
    utm_source: u.source || '', utm_medium: u.medium || '', utm_campaign: u.campaign || '',
    utm_term: u.term || '', utm_content: u.content || '',
  };
}

/** Parse UTM params from the current URL into one object, persist to sessionStorage (+ копия в localStorage). */
export function captureUtm(): Utm {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  UTM_KEYS.forEach((k) => {
    const v = q.get('utm_' + k);
    if (v) utm[k] = v;
  });
  if (Object.keys(utm).length) {
    try { sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm)); } catch { /* ignore */ }
    try { localStorage.setItem(UTM_LOCAL_KEY, JSON.stringify(toUtmFields(utm))); } catch { /* ignore */ }
  }
  return utm;
}

/** Метки визита: сначала sessionStorage, при пустом — копия из localStorage (другая вкладка/документ). */
export function getUtm(): Utm {
  try {
    const s = JSON.parse(sessionStorage.getItem(UTM_SESSION_KEY) || '{}') as Utm;
    if (s && Object.keys(s).length) return s;
  } catch { /* ignore */ }
  try {
    const l = JSON.parse(localStorage.getItem(UTM_LOCAL_KEY) || '{}') as Partial<UtmFields>;
    const utm: Utm = {};
    UTM_KEYS.forEach((k) => {
      const v = l[('utm_' + k) as keyof UtmFields];
      if (typeof v === 'string' && v) utm[k] = v;
    });
    return utm;
  } catch {
    return {};
  }
}

/** Поля utm_* для payload заявки — одни имена с инпутами формы A Tilda; пустые строки, если меток нет. */
export function getUtmFields(): UtmFields {
  return toUtmFields(getUtm());
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
    console.info('[analytics] placeholders active — no trackers loaded. UTM:', getUtm());
  }
}

function initYandexMetrika(id: string): void {
  (function (m: any, e: any, t: any, r: any, i: any) {
    // eslint-disable-next-line prefer-rest-params -- verbatim Yandex.Metrika snippet
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
  // eslint-disable-next-line prefer-rest-params -- verbatim gtag.js snippet
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

// ─────────────────────────────────────────────────────────────
// Sprint 15: события целей Метрики. Счётчик 111308276 стоит в head Tilda
// (со своим init + ecommerce:"dataLayer" — покупки Store уходят сами),
// поэтому здесь НЕ инициализируем второй раз — только шлём события через
// window.ym, который уже создан head-скриптом.
// Каждое событие дублируется в params: reachGoal без созданной цели Метрика
// отбрасывает, а параметры визита видны всегда (отчёт «Параметры визитов»).
// ─────────────────────────────────────────────────────────────
export const YM_COUNTER = 111308276;

export function track(goal: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.ym?.(YM_COUNTER, 'reachGoal', goal, params);
    window.ym?.(YM_COUNTER, 'params', { mbezu: { [goal]: params || true } });
  } catch { /* аналитика никогда не мешает UX */ }
}
