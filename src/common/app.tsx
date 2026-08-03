// ─────────────────────────────────────────────────────────────
// app.tsx — мультистраничный каркас: Shell (TopBar + main + Footer),
// URL-навигация go(), монтирование страницы в #root.
// Dev-панель Tweaks в прод-сборку НЕ входит — берём TWEAK_DEFAULTS.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { TopBar, Footer, BottomTabBar } from './chrome';
import { useCart } from './cart';
import { initAnalytics } from './analytics';

export const TWEAK_DEFAULTS = {
  palette: 'maison',
  dark: false,
  hero: 'editorial',
  density: 'regular',
  accent: '#6f5c2b',   // Sprint 15: см. комментарий у --accent в styles.css
} as const;

// Маршруты живут в ./routes — отдельным модулем, чтобы chrome.tsx и страницы
// могли строить настоящие href без цикла app ↔ chrome. Здесь только реэкспорт,
// чтобы не переписывать существующие импорты из './app'.
export type { RouteName, RouteParams } from './routes';
export { routeToPath, go } from './routes';

export { seriesSlug, SERIES_PAGES_LIVE } from './flags';

// ── URL param helpers for entries ────────────────────────────
export function qs(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return new URLSearchParams(window.location.search).get(key) || undefined;
}

/** Painting id: ?id=… wins; else last non-empty path segment (/painting/<id>). */
export function pathId(): string | undefined {
  const q = qs('id');
  if (q) return q.toUpperCase();
  if (typeof window === 'undefined') return undefined;
  const seg = window.location.pathname.replace(/\.html$/, '').split('/').filter(Boolean).pop();
  if (!seg || /^painting$/i.test(seg)) return undefined;
  return seg.toUpperCase();
}

// ── Shell ────────────────────────────────────────────────────
function Shell({ pageName, cartCount, children }: { pageName: string; cartCount: number; children?: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">К содержимому</a>
      <TopBar route={pageName} go={go} cartCount={cartCount} />
      <main id="main">{children}</main>
      <Footer go={go} />
      <BottomTabBar route={pageName} go={go} cartCount={cartCount} />
    </>
  );
}

export interface PageApi {
  go: typeof go;
  cart: string[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
}

/**
 * Mount a page inside the shell. Entries stay JSX-free (.ts):
 *   renderPage('painting', PaintingPage, (api) => ({ go: api.go, id, addToCart: api.addToCart }))
 */
export function renderPage(
  pageName: RouteName,
  PageComponent: React.ComponentType<any>,
  propsFactory?: (api: PageApi) => Record<string, unknown>,
): void {
  function Host() {
    const [cart, addToCart, removeFromCart] = useCart();
    const api: PageApi = { go, cart, addToCart, removeFromCart };
    const props = propsFactory ? propsFactory(api) : { go };
    return React.createElement(
      Shell,
      { pageName, cartCount: cart.length },
      React.createElement(PageComponent, props),
    );
  }

  const el = typeof document !== 'undefined' ? document.getElementById('root') : null;
  if (!el) return;
  initAnalytics();
  createRoot(el).render(React.createElement(React.StrictMode, null, React.createElement(Host)));
}
