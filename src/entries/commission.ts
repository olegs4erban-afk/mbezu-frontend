// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage, qs } from '../common/app';
import CommissionPage from '../pages/commission';

renderPage('commission', CommissionPage, (api) => ({ go: api.go, refId: qs('ref') }));
