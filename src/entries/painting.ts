// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, pathId } from '../common/app';
import PaintingPage from '../pages/painting';
import { ARTWORKS } from '../common/data';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const id = pathId() || ARTWORKS[0].id;
const seo = seoFor('painting', { id });
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-painting-' + i, ld); });
renderPage('painting', PaintingPage, (api) => ({ go: api.go, id, addToCart: api.addToCart }));