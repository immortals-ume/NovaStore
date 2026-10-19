const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (value) => currency.format(Number(value) || 0);

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '—');

// Mirrors backend/services/pricing.js so the cart can show an estimate; the server's totals are final.
export const FREE_SHIPPING_THRESHOLD = 100;
const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
export const estimateTotals = (items) => {
  const itemsPrice = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : 10;
  const taxPrice = round(itemsPrice * 0.15);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: round(itemsPrice + shippingPrice + taxPrice) };
};

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode); state still works for this session.
    }
  },
};

export const shortId = (id = '') => id.slice(-8).toUpperCase();
