// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage, TWEAK_DEFAULTS } from '../common/app';
import HomePage from '../pages/home';

renderPage('home', HomePage, (api) => ({ go: api.go, hero: TWEAK_DEFAULTS.hero }));
