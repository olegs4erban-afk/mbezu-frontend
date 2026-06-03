// ─────────────────────────────────────────────────────────────
// app.tsx — мультистраничный каркас: Shell (TopBar + main + Footer),
// URL-навигация go(), монтирование страницы в #root.
// Dev-панель Tweaks в прод-сборку НЕ входит — берём TWEAK_DEFAULTS.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { TopBar, Footer } from './chrome';
import { useCart } from './cart';
import { initAnalytics } from './analytics';

export const TWEAK_DEFAULTS = {
  palette: 'maison',
  dark: false,
  hero: 'editorial',
  density: 'regular',
  accent: '#b85c3a',
} as const;

export type RouteName =
  | 'home' | 'about' | 'catalog' | 'painting'
  | 'commission' | 'cart' | 'tracking' | 'legal';

export interface RouteParams { id?: string; series?: string; ref?: string; section?: string }

// Static MPA harnesses are served as <name>.html (works in vite preview AND on
// Cloudflare Pages, which also resolves the clean /<name> form). Painting uses a
// query id so navigation never depends on per-id prerendered files existing.
export function routeToPath(name: RouteName, params: RouteParams = {}): string {
  switch (name) {
    case 'home':       return '/';
    case 'painting':   return params.id ? `/painting.html?id=${encodeURIComponent(params.id)}` : '/painting.html';
    case 'catalog':    return params.series ? `/catalog.html?series=${encodeURIComponent(params.series)}` : '/catalog.html';
    case 'commission': return params.ref ? `/commission.html?ref=${encodeURIComponent(params.ref)}` : '/commission.html';
    case 'legal':      return params.section ? `/legal.html?section=${encodeURIComponent(params.section)}` : '/legal.html';
    default:           return `/${name}.html`;
  }
}

export function go(name: RouteName, params: RouteParams = {}): void {
  if (typeof window === 'undefined') return;
  window.location.href = routeToPath(name, params);
}

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
function Shell({ pageName, cartCount, children }: { pageName: string; cartCount: number; children: React.ReactNode }) {
  return (
    <>
      <TopBar route={pageName} go={go} cartCount={cartCount} />
      <main>{children}</main>
      <Footer go={go} />
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
