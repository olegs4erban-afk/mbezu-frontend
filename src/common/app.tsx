// ─────────────────────────────────────────────────────────────
// app.tsx — мультистраничный каркас: Shell (TopBar + main + Footer),
// URL-навигация go(), монтирование страницы в #root.
// Dev-панель Tweaks в прод-сборку НЕ входит — берём TWEAK_DEFAULTS.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';
import { TopBar, Footer, BottomTabBar } from './chrome';
import { initMotion } from './reveal';
import { hideTildaDuplicateChrome } from './tilda-chrome';
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
// ВАЖНО: именно import + export, а не `export { go } from './routes'`.
// Реэкспорт НЕ вводит имя в область видимости модуля, а app.tsx вызывает go()
// сам (Shell, PageApi) — с одним лишь реэкспортом это падало в бою
// «ReferenceError: go is not defined», и витрина не монтировалась вовсе.
import { routeToPath, go } from './routes';
import type { RouteName, RouteParams } from './routes';
export type { RouteName, RouteParams };
export { routeToPath, go };

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
// Одна шапка, один подвал, нижняя навигация на телефоне.
// Версия 2 (23.10.2026): тёмная липкая панель «Заказать картину» снята со всех
// страниц оболочки — на телефоне она стояла над таб-баром и закрывала до
// трети экрана, а оба пути («в наличии» и «на заказ») и так есть в таб-баре
// и в первом экране главной. Своя панель осталась только на /painting
// (цена + «Купить сейчас»), её рисует сама страница.
function Shell({ pageName, cartCount, children }: { pageName: string; cartCount: number; children?: React.ReactNode }) {
  React.useEffect(() => { hideTildaDuplicateChrome(); initMotion(); }, []);
  return (
    <>
      <a href="#main" className="skip-link">К содержимому</a>
      <TopBar route={pageName} cartCount={cartCount} />
      <main id="main">{children}</main>
      <Footer go={go} />
      {/* Нижняя навигация на телефоне (CSS показывает её ниже 900px) */}
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
  const app = React.createElement(React.StrictMode, null, React.createElement(Host));
  // Версия 2: если в #root уже лежит пререндер той же страницы — гидратируем,
  // а не перерисовываем. createRoot заменял готовую разметку новой, и браузер
  // засчитывал LCP по второй (такой же) картинке уже после загрузки JS:
  // на телефоне +2–3 с к LCP. Параметры, меняющие содержимое страницы
  // (серия, вкладка, работа), дают другую разметку — там рисуем с нуля.
  if (el.hasChildNodes() && canHydrate()) {
    hydrateRoot(el, app, {
      // расхождение пререндера с клиентом React исправляет сам — это не ошибка страницы
      onRecoverableError: (err) => { console.warn('[mbezu] hydration fallback:', err); },
    });
  } else {
    createRoot(el).render(app);
  }
}

/** Параметры адреса, от которых зависит разметка страницы. */
const RENDER_PARAMS = ['series', 'new', 'ref', 'section', 'id'];

function canHydrate(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    return !RENDER_PARAMS.some((k) => q.has(k));
  } catch { return false; }
}
