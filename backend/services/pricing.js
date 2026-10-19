import { roundMoney } from '../lib/money.js';

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 10;
export const TAX_RATE = 0.15;

// Server-side source of truth for order totals; client-sent prices are ignored.
export const priceOrder = (items) => {
  const itemsPrice = roundMoney(items.reduce((sum, { price, qty }) => sum + price * qty, 0));
  const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice = roundMoney(itemsPrice * TAX_RATE);
  const totalPrice = roundMoney(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};
