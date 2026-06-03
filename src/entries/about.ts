// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage } from '../common/app';
import AboutPage from '../pages/about';

renderPage('about', AboutPage, (api) => ({ go: api.go }));
