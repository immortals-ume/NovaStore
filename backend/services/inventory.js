import Product from '../models/product.js';
import { badRequest } from '../lib/httpError.js';

const restock = (reserved) =>
  Promise.all(
    reserved.map(({ product, qty }) => Product.updateOne({ _id: product }, { $inc: { countInStock: qty } })),
  );

/**
 * Atomically decrements stock for each line item. If any item is short,
 * the items already reserved are put back and the whole request fails.
 * Uses conditional updates instead of transactions so a standalone mongod works.
 */
export const reserveStock = async (items) => {
  const reserved = [];
  for (const item of items) {
    const { modifiedCount } = await Product.updateOne(
      { _id: item.product, countInStock: { $gte: item.qty } },
      { $inc: { countInStock: -item.qty } },
    );
    if (!modifiedCount) {
      await restock(reserved);
      throw badRequest(`Not enough stock for "${item.name}".`);
    }
    reserved.push(item);
  }
  return () => restock(reserved);
};

export { restock };
