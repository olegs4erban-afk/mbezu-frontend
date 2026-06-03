// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, qs } from '../common/app';
import LegalPage from '../pages/legal';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const section = qs('section');
const seo = seoFor('legal', { section });
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-legal-' + i, ld); });
renderPage('legal', LegalPage, (api) => ({ go: api.go, section }));