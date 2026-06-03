// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage, qs } from '../common/app';
import CommissionPage from '../pages/commission';
import { applySeo, injectJsonLd, seoFor } from '../common/seo';

const seo = seoFor('commission');
applySeo(seo);
seo.jsonLd.forEach((ld, i) => { if (ld) injectJsonLd('ld-commission-' + i, ld); });
renderPage('commission', CommissionPage, (api) => ({ go: api.go, refId: qs('ref') }));