import { roundMoney } from '../lib/money.js';

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 10;
export const TAX_RATE = 0.15;

/**
 * Calculates order totals on the server; prices sent by the client are ignored.
 * Shipping is free over FREE_SHIPPING_THRESHOLD; tax is TAX_RATE of the items total.
 * @param {Array<{price: number, qty: number}>} items - Order lines with prices taken from the database.
 * @returns {{itemsPrice: number, shippingPrice: number, taxPrice: number, totalPrice: number}}
 */
export const priceOrder = (items) => {
  const itemsPrice = roundMoney(items.reduce((sum, { price, qty }) => sum + price * qty, 0));
  const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice = roundMoney(itemsPrice * TAX_RATE);
  const totalPrice = roundMoney(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};
