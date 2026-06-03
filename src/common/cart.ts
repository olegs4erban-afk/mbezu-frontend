// ─────────────────────────────────────────────────────────────
// cart.ts — корзина на localStorage (мультистраничная персистентность).
// В dev-исходнике корзина была in-memory (useState в app.jsx); для сборки
// со страницами-документами нужна персистентность между переходами.
// ─────────────────────────────────────────────────────────────
import React from 'react';

const KEY = 'mbez-cart';
const EVT = 'mbez-cart-change';

export function getCart(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function save(cart: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* private mode / quota — ignore */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT));
}

export function addToCart(id: string): void {
  const c = getCart();
  if (!c.includes(id)) {
    c.push(id);
    save(c);
  }
}

export function removeFromCart(id: string): void {
  save(getCart().filter((x) => x !== id));
}

/** React hook: [cart, addToCart, removeFromCart] — syncs across tabs + components. */
export function useCart(): [string[], (id: string) => void, (id: string) => void] {
  const [cart, setCart] = React.useState<string[]>(() => getCart());

  React.useEffect(() => {
    const sync = () => setCart(getCart());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = (id: string) => { addToCart(id); setCart(getCart()); };
  const remove = (id: string) => { removeFromCart(id); setCart(getCart()); };
  return [cart, add, remove];
}
