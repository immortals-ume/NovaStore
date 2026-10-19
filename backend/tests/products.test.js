import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { api, createProduct, createUser, useDatabase } from './helpers.js';

const newProduct = {
  name: 'Linen Shirt',
  price: 59,
  image: '/images/p2.jpg',
  brand: 'Coastline',
  category: 'Shirts',
  countInStock: 3,
  description: 'Cool and light.',
};

describe('products', () => {
  useDatabase();

  it('answers malformed and unknown ids with 404 instead of hanging', async () => {
    await api().get('/api/products/abc').expect(404);
    await api().get('/api/products/507f1f77bcf86cd799439011').expect(404);
  });

  it('filters, sorts, paginates and treats search text literally', async () => {
    await createProduct({ name: 'Cheap Tee', price: 10 });
    await createProduct({ name: 'Fancy (Tee)', price: 90 });
    await createProduct({ name: 'Chinos', price: 50, category: 'Pants' });

    const shirts = await api().get('/api/products?category=Shirts&sortOrder=lowest').expect(200);
    assert.deepEqual(shirts.body.map((p) => p.name), ['Cheap Tee', 'Fancy (Tee)']);
    assert.equal(shirts.body[0].reviews, undefined);

    const literal = await api().get('/api/products?searchKeyword=(Tee').expect(200);
    assert.deepEqual(literal.body.map((p) => p.name), ['Fancy (Tee)']);

    const page = await api().get('/api/products?pageSize=2&page=2').expect(200);
    assert.equal(page.body.length, 1);
    assert.equal(page.headers['x-total-count'], '3');
    assert.equal(page.headers['x-page-count'], '2');

    const categories = await api().get('/api/products/categories').expect(200);
    assert.deepEqual(categories.body, ['Pants', 'Shirts']);
  });

  it('restricts catalog changes to admins and validates input', async () => {
    const user = await createUser();
    const admin = await createUser({ isAdmin: true });

    await api().post('/api/products').send(newProduct).expect(401);
    await api().post('/api/products').set(user.auth).send(newProduct).expect(403);
    await api().post('/api/products').set(admin.auth).send({ ...newProduct, price: -5 }).expect(400);

    const created = await api().post('/api/products').set(admin.auth).send({ ...newProduct, rating: 5, numReviews: 999 }).expect(201);
    assert.equal(created.body.data.rating, 0);
    assert.equal(created.body.data.numReviews, 0);

    const id = created.body.data._id;
    const updated = await api().put(`/api/products/${id}`).set(admin.auth).send({ ...newProduct, price: 64 }).expect(200);
    assert.equal(updated.body.data.price, 64);

    await api().delete(`/api/products/${id}`).set(admin.auth).expect(200);
    await api().delete(`/api/products/${id}`).set(admin.auth).expect(404);
  });

  it('allows one review per user, attributed to the signed-in user', async () => {
    const product = await createProduct();
    const user = await createUser();

    const res = await api()
      .post(`/api/products/${product.id}/reviews`)
      .set(user.auth)
      .send({ name: 'Someone Famous', rating: 4, comment: 'Nice fit.' })
      .expect(201);
    assert.equal(res.body.data.name, user.name);

    await api().post(`/api/products/${product.id}/reviews`).set(user.auth).send({ rating: 5, comment: 'Again' }).expect(409);
    await api().post(`/api/products/${product.id}/reviews`).set((await createUser()).auth).send({ rating: 9, comment: 'x' }).expect(400);

    const details = await api().get(`/api/products/${product.id}`).expect(200);
    assert.equal(details.body.rating, 4);
    assert.equal(details.body.numReviews, 1);
  });
});
