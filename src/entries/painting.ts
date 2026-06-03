// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage, pathId } from '../common/app';
import PaintingPage from '../pages/painting';
import { ARTWORKS } from '../common/data';

renderPage('painting', PaintingPage, (api) => ({ go: api.go, id: pathId() || ARTWORKS[0].id, addToCart: api.addToCart }));
