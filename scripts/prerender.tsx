// prerender.tsx — runs after `vite build`. Static-site-generation for SEO:
//  • renders each route to static markup → injects into <div id="root">
//  • injects per-route <title>/meta/canonical/OG + JSON-LD into <head>
//  • dir-style output (about/index.html, painting/<id>/index.html) so GitHub Pages
//    serves CLEAN URLs (/about, /painting/mn-01 → 200) matching live Tilda aliases
//  • emits dist/sitemap.xml
// Note: client uses createRoot (not hydrate) → markup is SEO/first-paint, then
// React re-renders on load. No hydration mismatch warnings.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { TopBar, Footer } from '../src/common/chrome';
import { ARTWORKS } from '../src/common/data';
import { seoFor, SITE_ORIGIN, type RouteSeo } from '../src/common/seo';
import HomePage from '../src/pages/home';
import AboutPage from '../src/pages/about';
import CatalogPage from '../src/pages/catalog';
import PaintingPage from '../src/pages/painting';
import CommissionPage from '../src/pages/commission';
import TrackingPage from '../src/pages/tracking';
import LegalPage from '../src/pages/legal';

const DIST = resolve('dist');
const NOOP = () => {};

function pageEl(name: string, params: any): React.ReactElement | null {
  switch (name) {
    case 'home': return <HomePage go={NOOP} hero="editorial" />;
    case 'about': return <AboutPage go={NOOP} />;
    case 'catalog': return <CatalogPage go={NOOP} density="regular" initialSeries={params.series} />;
    case 'painting': return <PaintingPage go={NOOP} id={params.id} addToCart={NOOP} />;
    case 'commission': return <CommissionPage go={NOOP} refId={undefined} />;
    case 'tracking': return <TrackingPage go={NOOP} />;
    case 'legal': return <LegalPage go={NOOP} section={params.section} />;
    default: return null;
  }
}

function renderMarkup(name: string, params: any): string {
  const el = pageEl(name, params);
  if (!el) return '';
  return renderToStaticMarkup(
    <>
      <TopBar route={name} go={NOOP} cartCount={0} />
      <main>{el}</main>
      <Footer go={NOOP} />
    </>,
  );
}

const esc = (s: unknown) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headFragment(seo: RouteSeo, name: string): string {
  const t: string[] = [];
  if (seo.description) t.push(`<meta name="description" content="${esc(seo.description)}">`);
  if (seo.canonical) t.push(`<link rel="canonical" href="${esc(seo.canonical)}">`);
  t.push(`<meta property="og:title" content="${esc(seo.ogTitle || seo.title)}">`);
  if (seo.description) t.push(`<meta property="og:description" content="${esc(seo.ogDescription || seo.description)}">`);
  t.push(`<meta property="og:type" content="${esc(seo.ogType || 'website')}">`);
  if (seo.canonical) t.push(`<meta property="og:url" content="${esc(seo.canonical)}">`);
  if (seo.ogImage) t.push(`<meta property="og:image" content="${esc(seo.ogImage)}">`);
  t.push('<meta property="og:locale" content="ru_RU">');
  t.push('<meta property="og:site_name" content="M.Bez">');
  if (seo.noindex) t.push('<meta name="robots" content="noindex,nofollow">');
  // id matches client injectJsonLd('ld-<name>-<i>') so hydration replaces (no duplicate)
  (seo.jsonLd || []).forEach((ld, i) => {
    if (ld) t.push(`<script type="application/ld+json" id="ld-${name}-${i}">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  });
  return t.join('\n');
}

function inject(html: string, seo: RouteSeo, markup: string, name: string): string {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  html = html.replace('</head>', headFragment(seo, name) + '\n</head>');
  if (markup) html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  return html;
}

function write(file: string, content: string) {
  const p = resolve(DIST, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf-8');
}

// ── static routes (content + head) ───────────────────────────
const STATIC: Array<{ name: string; file: string; params?: any; contentful?: boolean }> = [
  { name: 'home', file: 'index.html', contentful: true },
  { name: 'about', file: 'about.html', contentful: true },
  { name: 'catalog', file: 'catalog.html', contentful: true },
  { name: 'commission', file: 'commission.html', contentful: true },
  { name: 'tracking', file: 'tracking.html', contentful: true },
  { name: 'legal', file: 'legal.html', contentful: true },
  { name: 'cart', file: 'cart.html', contentful: false }, // head-only (noindex order flow)
];

// dir-style target so GH Pages serves clean URLs. home stays at root index.html;
// others → <name>/index.html; flat <name>.html (Vite output) is removed.
const outFile = (name: string) => (name === 'home' ? 'index.html' : `${name}/index.html`);

let count = 0;
for (const r of STATIC) {
  const src = resolve(DIST, r.file);
  if (!existsSync(src)) { console.warn(`  ! missing ${r.file}, skipped`); continue; }
  const seo = seoFor(r.name, r.params || {});
  const markup = r.contentful ? renderMarkup(r.name, r.params || {}) : '';
  write(outFile(r.name), inject(readFileSync(src, 'utf-8'), seo, markup, r.name));
  if (r.name !== 'home') rmSync(src); // drop flat <name>.html — dir-style is authoritative
  console.log(`  ✓ ${outFile(r.name)}${markup ? '' : ' (head only)'}`);
  count++;
}

// ── painting: /painting (template) + /painting/<id> per-artwork (dir-style) ──
const tplPath = resolve(DIST, 'painting.html');
if (existsSync(tplPath)) {
  const template = readFileSync(tplPath, 'utf-8');
  const first = ARTWORKS[0];
  write('painting/index.html', inject(template, seoFor('painting', { id: first.id }), renderMarkup('painting', { id: first.id }), 'painting'));
  count++;
  for (const art of ARTWORKS) {
    const seo = seoFor('painting', { id: art.id });
    const html = inject(template, seo, renderMarkup('painting', { id: art.id }), 'painting');
    write(`painting/${art.id.toLowerCase()}/index.html`, html);
    count++;
  }
  rmSync(tplPath); // drop flat painting.html
  console.log(`  ✓ painting/index.html + ${ARTWORKS.length} per-artwork dirs`);
}

// ── sitemap.xml ──────────────────────────────────────────────
const urls = [
  '/', '/about', '/catalog', '/commission', '/legal',
  ...ARTWORKS.map((a) => `/painting/${a.id.toLowerCase()}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map((u) => `  <url><loc>${SITE_ORIGIN}${u}</loc></url>`).join('\n')
  + `\n</urlset>\n`;
write('sitemap.xml', sitemap);
console.log(`  ✓ sitemap.xml (${urls.length} urls)`);
console.log(`[prerender] done — ${count} html pages generated`);
