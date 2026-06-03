// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, TWEAK_DEFAULTS } from '../common/app';
import HomePage from '../pages/home';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const seo = seoFor('home');
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-home-' + i, ld); });
renderPage('home', HomePage, (api) => ({ go: api.go, hero: TWEAK_DEFAULTS.hero }));