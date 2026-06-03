// entry point — mounts page into #root + applies per-route SEO (Vite multipage)
import { renderPage } from '../common/app';
import CartPage from '../pages/cart';
import { applySeo, seoFor } from '../common/seo';

applySeo(seoFor('cart'));
renderPage('cart', CartPage, (api) => ({ go: api.go, cart: api.cart, removeFromCart: api.removeFromCart }));