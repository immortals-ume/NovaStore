import { createContext, use, useEffect, useMemo, useState } from 'react';
import { storage } from '../lib.js';

const ITEMS_KEY = 'novastore.cart';
const SHIPPING_KEY = 'novastore.shipping';
const CartContext = createContext(null);

/**
 * @param {string} productId
 * @param {string} [size]
 * @returns {string} Key that identifies a cart line, so each size is its own line.
 */
const lineKey = (productId, size) => `${productId}:${size ?? ''}`;

/**
 * Provides the shopping bag (saved in localStorage), the saved shipping address
 * and the bag drawer's open state. Quantities never exceed the product's stock.
 * @param {{children: React.ReactNode}} props
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => storage.get(ITEMS_KEY, []));
  const [shipping, setShipping] = useState(() => storage.get(SHIPPING_KEY, null));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    storage.set(ITEMS_KEY, items);
  }, [items]);
  useEffect(() => {
    storage.set(SHIPPING_KEY, shipping);
  }, [shipping]);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    return {
      items,
      count,
      shipping,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      saveShipping: setShipping,
      add: (product, { size, qty = 1 } = {}) => {
        const key = lineKey(product._id, size);
        setItems((current) => {
          const existing = current.find((i) => i.key === key);
          const max = product.countInStock;
          if (existing) {
            return current.map((i) => (i.key === key ? { ...i, qty: Math.min(max, i.qty + qty) } : i));
          }
          return [
            ...current,
            {
              key,
              product: product._id,
              name: product.name,
              brand: product.brand,
              image: product.image,
              price: product.price,
              color: product.color,
              size,
              countInStock: max,
              qty: Math.min(max, qty),
            },
          ];
        });
        setDrawerOpen(true);
      },
      setQty: (key, qty) => setItems((current) => current.map((i) => (i.key === key ? { ...i, qty } : i))),
      remove: (key) => setItems((current) => current.filter((i) => i.key !== key)),
      clear: () => setItems([]),
    };
  }, [items, shipping, drawerOpen]);

  return <CartContext value={value}>{children}</CartContext>;
}

/**
 * @returns The bag: `items`, `count`, `shipping`, `drawerOpen` and actions
 * `add`, `setQty`, `remove`, `clear`, `saveShipping`, `openDrawer`, `closeDrawer`.
 */
export const useCart = () => use(CartContext);
