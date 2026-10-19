/**
 * Rounds an amount to whole cents so totals are stable and accepted by payment providers.
 * @param {number} value - Amount in dollars.
 * @returns {number} The amount rounded to 2 decimal places.
 */
export const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
