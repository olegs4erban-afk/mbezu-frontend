// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, qs, TWEAK_DEFAULTS } from '../common/app';
import CatalogPage from '../pages/catalog';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';
import { seriesBySlug } from '../common/data';

// Sprint 14 (Ф6): серия берётся из пути /catalog/<slug>; ?series= остаётся для совместимости
function seriesFromPath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const seg = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
  if (!seg || seg === 'catalog') return undefined;
  return (seriesBySlug(seg) as any)?.id;
}

const series = seriesFromPath() || qs('series');
const seo = seoFor('catalog', { series });
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-catalog-' + i, ld); });
renderPage('catalog', CatalogPage, (api) => ({ go: api.go, density: TWEAK_DEFAULTS.density, initialSeries: series }));
