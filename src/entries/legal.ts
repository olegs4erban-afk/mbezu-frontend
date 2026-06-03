// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage, qs } from '../common/app';
import LegalPage from '../pages/legal';

renderPage('legal', LegalPage, (api) => ({ go: api.go, section: qs('section') }));
