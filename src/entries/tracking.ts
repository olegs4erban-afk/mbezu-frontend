// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage } from '../common/app';
import TrackingPage from '../pages/tracking';
import { applySeo, seoFor } from '../common/seo';

applySeo(seoFor('tracking'));
renderPage('tracking', TrackingPage, (api) => ({ go: api.go }));