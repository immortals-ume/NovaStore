import { z } from 'zod';
import Product from '../models/product.js';
import { conflict, notFound } from '../lib/httpError.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listQuerySchema = z.object({
  category: z.string().trim().max(60).optional().default(''),
  searchKeyword: z.string().trim().max(100).optional().default(''),
  sortOrder: z.enum(['', 'newest', 'lowest', 'highest', 'rating']).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.coerce.number().min(0).max(1_000_000),
  image: z.string().trim().min(1).max(500),
  brand: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(60),
  countInStock: z.coerce.number().int().min(0).max(1_000_000),
  description: z.string().trim().min(1).max(5000),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

const SORTS = {
  lowest: { price: 1, _id: -1 },
  highest: { price: -1, _id: -1 },
  rating: { rating: -1, _id: -1 },
  newest: { _id: -1 },
  '': { _id: -1 },
};

// The body stays a plain array for compatibility; paging info is sent in headers.
export const list = async (req, res) => {
  const { category, searchKeyword, sortOrder, page, pageSize } = req.validatedQuery;
  const filter = {
    ...(category && { category }),
    ...(searchKeyword && { name: { $regex: escapeRegex(searchKeyword), $options: 'i' } }),
  };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-reviews')
      .sort(SORTS[sortOrder])
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.set({
    'X-Total-Count': String(total),
    'X-Page': String(page),
    'X-Page-Count': String(Math.max(1, Math.ceil(total / pageSize))),
  });
  res.send(products);
};

export const categories = async (_req, res) => {
  res.send((await Product.distinct('category')).sort());
};

export const getById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.send(product);
};

export const create = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).send({ message: 'New Product Created', data: product });
};

export const update = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!product) throw notFound('Product not found.');
  res.send({ message: 'Product Updated', data: product });
};

export const remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.send({ message: 'Product Deleted' });
};

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
