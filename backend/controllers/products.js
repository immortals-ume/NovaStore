import { z } from 'zod';
import Product from '../models/product.js';
import { conflict, notFound } from '../lib/httpError.js';
import { searchProducts } from '../services/productSearch.js';
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  DEPARTMENTS,
  DEPARTMENT_SLUGS,
  SIZES,
  categoryAllowedIn,
} from '../lib/catalog.js';

/**
 * Builds a zod schema for an optional query filter where an empty string means "any".
 * @param {readonly string[]} values - Allowed values.
 * @returns {import('zod').ZodType}
 */
const optionalEnum = (values) => z.enum(['', ...values]).optional().default('');

export const listQuerySchema = z.object({
  department: optionalEnum(DEPARTMENT_SLUGS),
  category: optionalEnum(CATEGORY_SLUGS),
  size: optionalEnum(SIZES),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  searchKeyword: z.string().trim().max(100).optional().default(''),
  sortOrder: z.enum(['', 'newest', 'lowest', 'highest', 'rating']).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    price: z.coerce.number().min(0).max(1_000_000),
    image: z.string().trim().min(1).max(500),
    brand: z.string().trim().min(1).max(100),
    department: z.enum(DEPARTMENT_SLUGS),
    category: z.enum(CATEGORY_SLUGS),
    sizes: z.array(z.enum(SIZES)).max(SIZES.length).optional().default([]),
    color: z.string().trim().max(40).optional(),
    countInStock: z.coerce.number().int().min(0).max(1_000_000),
    description: z.string().trim().min(1).max(5000),
  })
  .refine((p) => categoryAllowedIn(p.category, p.department), {
    message: 'This category is not available in the selected department.',
    path: ['category'],
  });

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

/**
 * GET /api/products - Lists products with filters, search, sorting and paging.
 * The body stays a plain array for compatibility; totals are sent in the
 * `X-Total-Count`, `X-Page` and `X-Page-Count` headers. Reviews are left out.
 * @param {import('express').Request} req - `req.validatedQuery` holds the parsed filters.
 * @param {import('express').Response} res
 */
export const list = async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const { products, total } = await searchProducts(req.validatedQuery);
  res.set({
    'X-Total-Count': String(total),
    'X-Page': String(page),
    'X-Page-Count': String(Math.max(1, Math.ceil(total / pageSize))),
  });
  res.send(products);
};

/**
 * GET /api/products/catalog - Returns departments, categories and sizes with live
 * product counts, used to build the store navigation.
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export const catalog = async (_req, res) => {
  const counts = await Product.aggregate([
    { $group: { _id: { department: '$department', category: '$category' }, count: { $sum: 1 } } },
  ]);
  const countOf = (department, category) =>
    counts
      .filter(({ _id }) => (!department || _id.department === department) && (!category || _id.category === category))
      .reduce((sum, { count }) => sum + count, 0);

  res.send({
    departments: DEPARTMENTS.map((d) => ({
      ...d,
      count: countOf(d.slug),
      categories: CATEGORIES.filter((c) => c.departments.includes(d.slug)).map((c) => ({
        slug: c.slug,
        name: c.name,
        count: countOf(d.slug, c.slug),
      })),
    })),
    categories: CATEGORIES.map((c) => ({ ...c, count: countOf(null, c.slug) })),
    sizes: SIZES,
  });
};

/**
 * GET /api/products/:id - Returns one product, including its reviews.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when the product does not exist.
 */
export const getById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.send(product);
};

/**
 * POST /api/products (admin) - Creates a product from the validated body.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const create = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).send({ message: 'New Product Created', data: product });
};

/**
 * PUT /api/products/:id (admin) - Replaces a product's fields with the validated body.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when the product does not exist.
 */
export const update = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!product) throw notFound('Product not found.');
  res.send({ message: 'Product Updated', data: product });
};

/**
 * DELETE /api/products/:id (admin) - Deletes a product.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when the product does not exist.
 */
export const remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.send({ message: 'Product Deleted' });
};

/**
 * POST /api/products/:id/reviews - Adds the signed-in user's review and updates the
 * product's average rating. Each user can review a product once.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when the product does not exist, 409 when already reviewed.
 */
export const addReview = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  if (product.reviews.some((r) => String(r.user) === String(req.user._id))) {
    throw conflict('You have already reviewed this product.');
  }

  product.reviews.push({ ...req.body, user: req.user._id, name: req.user.name });
  product.recalculateRating();
  await product.save();

  res.status(201).send({ message: 'Review saved successfully.', data: product.reviews.at(-1) });
};
