// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage } from '../common/app';
import AboutPage from '../pages/about';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const seo = seoFor('about');
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-about-' + i, ld); });
renderPage('about', AboutPage, (api) => ({ go: api.go }));