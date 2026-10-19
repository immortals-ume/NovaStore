import Product from '../models/product.js';

const SORTS = {
  lowest: { price: 1, _id: -1 },
  highest: { price: -1, _id: -1 },
  rating: { rating: -1, _id: -1 },
  newest: { _id: -1 },
  '': { _id: -1 },
};

/**
 * Escapes regex special characters so user search text is matched literally.
 * @param {string} text - Raw search text.
 * @returns {string} Text safe to use inside a RegExp.
 */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finds products matching the given filters. Shared by the product list API and the
 * shopping assistant so both search the catalog the same way. Reviews are left out.
 * @param {object} query
 * @param {string} [query.department] - Department slug.
 * @param {string} [query.category] - Category slug.
 * @param {string} [query.size] - Only products offered in this size.
 * @param {number} [query.minPrice]
 * @param {number} [query.maxPrice]
 * @param {string} [query.searchKeyword] - Matched against name and brand, case-insensitive.
 * @param {'' | 'newest' | 'lowest' | 'highest' | 'rating'} [query.sortOrder]
 * @param {number} [query.page] - 1-based page number.
 * @param {number} [query.pageSize]
 * @returns {Promise<{products: object[], total: number}>} One page of products and the total match count.
 */
export const searchProducts = async ({
  department,
  category,
  size,
  minPrice,
  maxPrice,
  searchKeyword,
  sortOrder = '',
  page = 1,
  pageSize = 50,
}) => {
  const search = searchKeyword && { $regex: escapeRegex(searchKeyword), $options: 'i' };
  const filter = {
    ...(department && { department }),
    ...(category && { category }),
    ...(size && { sizes: size }),
    ...((minPrice != null || maxPrice != null) && {
      price: { ...(minPrice != null && { $gte: minPrice }), ...(maxPrice != null && { $lte: maxPrice }) },
    }),
    ...(search && { $or: [{ name: search }, { brand: search }] }),
  };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-reviews')
      .sort(SORTS[sortOrder] ?? SORTS[''])
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total };
};
