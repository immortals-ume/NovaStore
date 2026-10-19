import { z } from 'zod';
import Order from '../models/order.js';
import Product from '../models/product.js';
import { isOwnerOrAdmin } from '../middleware/auth.js';
import { objectId } from '../middleware/validate.js';
import { badRequest, conflict, notFound } from '../lib/httpError.js';
import { priceOrder } from '../services/pricing.js';
import { reserveStock, restock } from '../services/inventory.js';
import { verifyPayment } from '../services/paypal.js';

const text = z.string().trim().min(1).max(200);

// Only product ids and quantities are trusted; names, images and prices come from the database.
export const createSchema = z.object({
  orderItems: z
    .array(z.object({ product: objectId, qty: z.coerce.number().int().min(1).max(100) }))
    .min(1, 'Your cart is empty.')
    .max(50),
  shipping: z.object({ address: text, city: text, postalCode: text, country: text }),
  payment: z.object({ paymentMethod: z.enum(['paypal']) }),
});

export const paySchema = z.object({ orderID: z.string().trim().min(1).max(64) });

const findAccessibleOrder = async (req) => {
  const order = await Order.findById(req.params.id);
  // Report other users' orders as missing so ids cannot be probed.
  if (!order || !isOwnerOrAdmin(req, order.user)) throw notFound('Order not found.');
  return order;
};

export const create = async (req, res) => {
  const { orderItems, shipping, payment } = req.body;

  const quantities = new Map();
  for (const { product, qty } of orderItems) {
    quantities.set(product, (quantities.get(product) ?? 0) + qty);
  }
  const products = await Product.find({ _id: { $in: [...quantities.keys()] } }).lean();
  if (products.length !== quantities.size) throw badRequest('Some products in your cart no longer exist.');

  const items = products.map((p) => ({
    product: p._id,
    name: p.name,
    image: p.image,
    price: p.price,
    qty: quantities.get(String(p._id)),
  }));

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

export const listAll = async (_req, res) => {
  res.send(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
};

export const listMine = async (req, res) => {
  res.send(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
};

export const getById = async (req, res) => {
  res.send(await findAccessibleOrder(req));
};

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

export const deliver = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found.');
  if (!order.isPaid) throw badRequest('Only paid orders can be delivered.');

  order.isDelivered = true;
  order.deliveredAt = new Date();
  await order.save();
  res.send({ message: 'Order Delivered.', order });
};

export const remove = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) throw notFound('Order not found.');
  // Goods that never shipped go back on the shelf.
  if (!order.isDelivered) await restock(order.orderItems);
  res.send(order);
};
