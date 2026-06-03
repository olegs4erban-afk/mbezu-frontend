// Routes to prerender to static HTML at build time (Phase 4 SSG).
// Each route maps to a page module + the params its component expects.
// `painting` uses a template artwork id; per-artwork prerender is driven by data.ts.

export interface PrerenderRoute {
  /** route name == entry/page name */
  name: string;
  /** output html path under dist/ */
  out: string;
  /** params passed to the page component (e.g. painting id, legal section) */
  params?: Record<string, string>;
}

// Critical pages prerendered eagerly. Painting template + per-artwork pages are
// expanded from ARTWORKS inside scripts/prerender.ts.
export const PRERENDER_ROUTES: PrerenderRoute[] = [
  { name: 'home', out: 'index.html' },
  { name: 'about', out: 'about.html' },
  { name: 'catalog', out: 'catalog.html' },
  { name: 'commission', out: 'commission.html' },
  { name: 'tracking', out: 'tracking.html' },
  { name: 'legal', out: 'legal.html' },
  // painting template (first artwork) + per-id pages added programmatically
];

export const SITE_ORIGIN = 'https://mbezu.ru';
export const CDN_ORIGIN = 'https://cdn.mbezu.ru';
