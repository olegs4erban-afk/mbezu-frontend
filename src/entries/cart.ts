// entry point — mounts the page into #root (Vite multipage входная точка)
import { renderPage } from '../common/app';
import CartPage from '../pages/cart';

renderPage('cart', CartPage, (api) => ({ go: api.go, cart: api.cart, removeFromCart: api.removeFromCart }));
