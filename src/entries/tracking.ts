// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage } from '../common/app';
import TrackingPage from '../pages/tracking';

renderPage('tracking', TrackingPage, (api) => ({ go: api.go }));
