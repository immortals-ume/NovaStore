import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { api, createProduct, createUser, Product, shipping, useDatabase } from './helpers.js';

const payment = { paymentMethod: 'paypal' };

const placeOrder = (user, orderItems, extra = {}) =>
  api().post('/api/orders').set(user.auth).send({ orderItems, shipping, payment, ...extra });

describe('orders', () => {
  useDatabase();

  it('prices orders on the server and ignores client-sent prices', async () => {
    const shirt = await createProduct({ price: 33.33, countInStock: 5 });
    const user = await createUser();

    const res = await placeOrder(
      user,
      [{ product: shirt.id, qty: 2, price: 0.01, name: 'Free shirt' }],
      { itemsPrice: 0, taxPrice: 0, shippingPrice: 0, totalPrice: 0 },
    ).expect(201);

    const order = res.body.data;
    assert.equal(order.orderItems[0].price, 33.33);
    assert.equal(order.orderItems[0].name, 'Test Shirt');
    assert.equal(order.itemsPrice, 66.66);
    assert.equal(order.shippingPrice, 10);
    assert.equal(order.taxPrice, 10);
    assert.equal(order.totalPrice, 86.66);
    assert.equal((await Product.findById(shirt.id)).countInStock, 3);
  });

  it('refuses to oversell and releases stock already reserved', async () => {
    const plenty = await createProduct({ name: 'Plenty', countInStock: 10 });
    const scarce = await createProduct({ name: 'Scarce', countInStock: 1 });
    const user = await createUser();

    const res = await placeOrder(user, [
      { product: plenty.id, qty: 2 },
      { product: scarce.id, qty: 2 },
    ]).expect(400);
    assert.match(res.body.message, /Scarce/);
    assert.equal((await Product.findById(plenty.id)).countInStock, 10);
    assert.equal((await Product.findById(scarce.id)).countInStock, 1);
  });

  it('keeps orders private to their owner and admins', async () => {
    const product = await createProduct();
    const owner = await createUser();
    const stranger = await createUser();
    const admin = await createUser({ isAdmin: true });
    const { body } = await placeOrder(owner, [{ product: product.id, qty: 1 }]).expect(201);
    const id = body.data._id;

    await api().get(`/api/orders/${id}`).set(owner.auth).expect(200);
    await api().get(`/api/orders/${id}`).set(admin.auth).expect(200);
    await api().get(`/api/orders/${id}`).set(stranger.auth).expect(404);
    await api().get('/api/orders').set(owner.auth).expect(403);

    const mine = await api().get('/api/orders/mine').set(stranger.auth).expect(200);
    assert.equal(mine.body.length, 0);

    const all = await api().get('/api/orders').set(admin.auth).expect(200);
    assert.equal(all.body[0].user.name, owner.name);
    assert.equal(all.body[0].user.password, undefined);
  });

  it('pays once, then delivers; deleting an undelivered order restocks', async () => {
    const product = await createProduct({ countInStock: 4 });
    const user = await createUser();
    const admin = await createUser({ isAdmin: true });
    const { body } = await placeOrder(user, [{ product: product.id, qty: 3 }]).expect(201);
    const id = body.data._id;

    await api().put(`/api/orders/${id}/deliver`).set(admin.auth).expect(400);

    const paid = await api().put(`/api/orders/${id}/pay`).set(user.auth).send({ orderID: 'PAYPAL-1' }).expect(200);
    assert.equal(paid.body.order.isPaid, true);
    assert.equal(paid.body.order.payment.paymentResult.verified, false);
    await api().put(`/api/orders/${id}/pay`).set(user.auth).send({ orderID: 'PAYPAL-2' }).expect(409);

    const { body: second } = await placeOrder(user, [{ product: product.id, qty: 1 }]).expect(201);
    await api().put(`/api/orders/${second.data._id}/pay`).set(user.auth).send({ orderID: 'PAYPAL-1' }).expect(409);

    await api().put(`/api/orders/${id}/deliver`).set(user.auth).expect(403);
    const delivered = await api().put(`/api/orders/${id}/deliver`).set(admin.auth).expect(200);
    assert.equal(delivered.body.order.isDelivered, true);

    await api().delete(`/api/orders/${second.data._id}`).set(admin.auth).expect(200);
    assert.equal((await Product.findById(product.id)).countInStock, 1);
  });

  it('requires an available size for sized products and keeps sizes per line', async () => {
    const tee = await createProduct({ sizes: ['S', 'M'], countInStock: 10 });
    const user = await createUser();

    await placeOrder(user, [{ product: tee.id, qty: 1 }]).expect(400);
    await placeOrder(user, [{ product: tee.id, qty: 1, size: 'XL' }]).expect(400);

    const { body } = await placeOrder(user, [
      { product: tee.id, qty: 1, size: 'S' },
      { product: tee.id, qty: 2, size: 'M' },
      { product: tee.id, qty: 1, size: 'S' },
    ]).expect(201);
    const lines = body.data.orderItems.map(({ size, qty }) => `${size}x${qty}`).sort();
    assert.deepEqual(lines, ['Mx2', 'Sx2']);
    assert.equal((await Product.findById(tee.id)).countInStock, 6);
  });

  it('validates order input', async () => {
    const user = await createUser();
    await placeOrder(user, []).expect(400);
    await placeOrder(user, [{ product: 'not-an-id', qty: 1 }]).expect(400);
    await placeOrder(user, [{ product: '507f1f77bcf86cd799439011', qty: 1 }]).expect(400);
    await api().post('/api/orders').send({}).expect(401);
  });
});
