import { z } from 'zod';
import Order from '../models/order.js';
import Product from '../models/product.js';
import { isOwnerOrAdmin } from '../middleware/auth.js';
import { objectId } from '../middleware/validate.js';
import { badRequest, conflict, notFound } from '../lib/httpError.js';
import { priceOrder } from '../services/pricing.js';
import { reserveStock, restock } from '../services/inventory.js';
import { verifyPayment } from '../services/paypal.js';
import { SIZES } from '../lib/catalog.js';

const text = z.string().trim().min(1).max(200);

// Only product ids and quantities are trusted; names, images and prices come from the database.
export const createSchema = z.object({
  orderItems: z
    .array(
      z.object({
        product: objectId,
        qty: z.coerce.number().int().min(1).max(100),
        size: z.enum(SIZES).optional(),
      }),
    )
    .min(1, 'Your cart is empty.')
    .max(50),
  shipping: z.object({ address: text, city: text, postalCode: text, country: text }),
  payment: z.object({ paymentMethod: z.enum(['paypal']) }),
});

export const paySchema = z.object({ orderID: z.string().trim().min(1).max(64) });

/**
 * Loads the order in `req.params.id` if the current user owns it or is an admin.
 * Other users' orders are reported as missing so ids cannot be probed.
 * @param {import('express').Request} req
 * @returns {Promise<import('mongoose').Document>} The order.
 * @throws {HttpError} 404 when missing or not accessible.
 */
const findAccessibleOrder = async (req) => {
  const order = await Order.findById(req.params.id);
  if (!order || !isOwnerOrAdmin(req, order.user)) throw notFound('Order not found.');
  return order;
};

/**
 * POST /api/orders - Places an order for the signed-in user.
 * Product names, images and prices are copied from the database, duplicate
 * product/size lines are merged, stock is reserved and totals are computed on the
 * server. Stock is released again if saving the order fails.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 400 for missing products, invalid sizes or insufficient stock.
 */
export const create = async (req, res) => {
  const { orderItems, shipping, payment } = req.body;

  const productIds = [...new Set(orderItems.map((item) => item.product))];
  const products = new Map(
    (await Product.find({ _id: { $in: productIds } }).lean()).map((p) => [String(p._id), p]),
  );
  if (products.size !== productIds.length) throw badRequest('Some products in your cart no longer exist.');

  // Merge duplicate product/size lines, then copy trusted details from the catalog.
  const lines = new Map();
  for (const { product: id, qty, size } of orderItems) {
    const product = products.get(id);
    if (product.sizes?.length && !product.sizes.includes(size)) {
      throw badRequest(`Choose an available size for "${product.name}".`);
    }
    const key = `${id}:${size ?? ''}`;
    const line = lines.get(key) ?? {
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      size: product.sizes?.length ? size : undefined,
      qty: 0,
    };
    line.qty += qty;
    lines.set(key, line);
  }
  const items = [...lines.values()];

  const release = await reserveStock(items);
  try {
    const order = await Order.create({
      user: req.user._id,
      orderItems: items,
      shipping,
      payment,
      ...priceOrder(items),
    });
    res.status(201).send({ message: 'New Order Created', data: order });
  } catch (err) {
    await release();
    throw err;
  }
};

/**
 * GET /api/orders (admin) - Lists every order, newest first, with the customer's name and email.
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export const listAll = async (_req, res) => {
  res.send(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
};

/**
 * GET /api/orders/mine - Lists the signed-in user's orders, newest first.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const listMine = async (req, res) => {
  res.send(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
};

/**
 * GET /api/orders/:id - Returns one order if the user owns it or is an admin.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getById = async (req, res) => {
  res.send(await findAccessibleOrder(req));
};

/**
 * PUT /api/orders/:id/pay - Marks an order paid after verifying the PayPal payment.
 * A PayPal payment can only be used for one order.
 * @param {import('express').Request} req - `req.body.orderID` is the PayPal order id.
 * @param {import('express').Response} res
 * @throws {HttpError} 409 when the order or the payment was already used.
 */
export const pay = async (req, res) => {
  const order = await findAccessibleOrder(req);
  if (order.isPaid) throw conflict('Order is already paid.');

  const result = await verifyPayment(req.body.orderID, order.totalPrice);
  if (await Order.exists({ 'payment.paymentResult.id': result.id })) {
    throw conflict('This payment has already been used.');
  }

  // Conditional update so two concurrent pay requests cannot both succeed.
  const paid = await Order.findOneAndUpdate(
    { _id: order._id, isPaid: false },
    { isPaid: true, paidAt: new Date(), payment: { paymentMethod: 'paypal', paymentResult: result } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!paid) throw conflict('Order is already paid.');
  res.send({ message: 'Order Paid.', order: paid });
};

/**
 * PUT /api/orders/:id/deliver (admin) - Marks a paid order as delivered.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when missing, 400 when the order is not paid.
 */
export const deliver = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found.');
  if (!order.isPaid) throw badRequest('Only paid orders can be delivered.');

  order.isDelivered = true;
  order.deliveredAt = new Date();
  await order.save();
  res.send({ message: 'Order Delivered.', order });
};

/**
 * DELETE /api/orders/:id (admin) - Deletes an order and returns undelivered items to stock.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {HttpError} 404 when the order does not exist.
 */
export const remove = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) throw notFound('Order not found.');
  // Goods that never shipped go back on the shelf.
  if (!order.isDelivered) await restock(order.orderItems);
  res.send(order);
};
