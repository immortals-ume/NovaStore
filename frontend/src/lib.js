const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * @param {number | string} value - Amount in dollars.
 * @returns {string} e.g. `$1,234.50`.
 */
export const formatPrice = (value) => currency.format(Number(value) || 0);

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

/**
 * @param {string | Date | undefined} value
 * @returns {string} e.g. `Oct 19, 2026`, or `—` when there is no date.
 */
export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '—');

export const FREE_SHIPPING_THRESHOLD = 100;

/**
 * @param {number} v
 * @returns {number} The amount rounded to whole cents.
 */
const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

/**
 * Estimates cart totals for display. Mirrors backend/services/pricing.js;
 * the server's totals are final.
 * @param {Array<{price: number, qty: number}>} items - Cart lines.
 * @returns {{itemsPrice: number, shippingPrice: number, taxPrice: number, totalPrice: number}}
 */
export const estimateTotals = (items) => {
  const itemsPrice = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : 10;
  const taxPrice = round(itemsPrice * 0.15);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: round(itemsPrice + shippingPrice + taxPrice) };
};

/**
 * Safe wrapper around localStorage that stores JSON and never throws
 * (e.g. in private browsing, where storage may be unavailable).
 */
export const storage = {
  /**
   * @param {string} key
   * @param {unknown} fallback - Returned when nothing is stored or it cannot be read.
   * @returns {unknown} The stored value.
   */
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Stores a value, or removes the key when the value is null or undefined.
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode); state still works for this session.
    }
  },
};

/**
 * @param {string} [id] - A MongoDB id.
 * @returns {string} The last 8 characters in upper case, used as a readable order number.
 */
export const shortId = (id = '') => id.slice(-8).toUpperCase();
