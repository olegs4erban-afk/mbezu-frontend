// ─────────────────────────────────────────────────────────────
// routes.ts — адреса страниц. Вынесено из app.tsx отдельным модулем,
// чтобы chrome.tsx и страницы могли строить настоящие href без
// циклического импорта (app.tsx → chrome.tsx → app.tsx).
//
// Sprint 15 (аудит, направление 1+4): навигация была сделана как
// <a href="#" onClick={…go()}>. Робот не видел ни одной внутренней
// ссылки (на главной 20 из 27 <a> вели на «#», на /catalog — ни одной
// ссылки на товар), а человек не мог открыть пункт меню в новой вкладке.
// go() и так делает window.location.href = routeToPath(...), то есть
// обычный переход, — поэтому href достаточно, обработчик не нужен.
// ─────────────────────────────────────────────────────────────
import { seriesSlug, SERIES_PAGES_LIVE } from './flags';
import { storeProductPath } from './store-urls';

export type RouteName =
  | 'home' | 'about' | 'catalog' | 'painting'
  | 'commission' | 'cart' | 'tracking' | 'legal';

export interface RouteParams { id?: string; series?: string; ref?: string; section?: string }

// CLEAN aliases — matching the live Tilda page structure (verified: /about → 200,
// /about.html → 404; /painting/<id> → 200). The CDN serves the same clean URLs via
// dir-style prerender (about/index.html, painting/<id>/index.html — see scripts/prerender.tsx).
export function routeToPath(name: RouteName, params: RouteParams = {}): string {
  switch (name) {
    case 'home':       return '/';
    // 3C: a work opens on its NATIVE Tilda Store product page (buy → cart 706 →
    // YooKassa). Fallback to the React painting alias if a work isn't mapped.
    case 'painting':   return (params.id && storeProductPath(params.id)) || (params.id ? `/painting/${encodeURIComponent(String(params.id).toLowerCase())}` : '/painting');
    // Sprint 14 (Ф6): серии — отдельные URL /catalog/<slug>; до создания страниц Tilda — ?series=
    case 'catalog':    return params.series
      ? (SERIES_PAGES_LIVE ? `/catalog/${seriesSlug(params.series)}` : `/catalog?series=${encodeURIComponent(params.series)}`)
      : '/catalog';
    case 'commission': return params.ref ? `/commission?ref=${encodeURIComponent(params.ref)}` : '/commission';
    case 'legal':      return params.section ? `/legal?section=${encodeURIComponent(params.section)}` : '/legal';
    default:           return `/${name}`;
  }
}

export function go(name: RouteName, params: RouteParams = {}): void {
  if (typeof window === 'undefined') return;
  window.location.href = routeToPath(name, params);
}
