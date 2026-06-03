// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage, qs, TWEAK_DEFAULTS } from '../common/app';
import CatalogPage from '../pages/catalog';

renderPage('catalog', CatalogPage, (api) => ({ go: api.go, density: TWEAK_DEFAULTS.density, initialSeries: qs('series') }));
