// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, qs, TWEAK_DEFAULTS } from '../common/app';
import CatalogPage from '../pages/catalog';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const series = qs('series');
const seo = seoFor('catalog', { series });
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-catalog-' + i, ld); });
renderPage('catalog', CatalogPage, (api) => ({ go: api.go, density: TWEAK_DEFAULTS.density, initialSeries: series }));