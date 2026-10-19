import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

// Config is read at import time, so the environment must be set before the app loads.
process.env.UPLOAD_DIR = await mkdtemp(path.join(tmpdir(), 'novastore-uploads-'));
process.env.AUTH_RATE_LIMIT = '1000';

const { createApp } = await import('../app.js');
const { default: User } = await import('../models/user.js');
const { default: Product } = await import('../models/product.js');

export const app = createApp();
export const api = () => request(app);
export { User, Product };

let mongo;
export const useDatabase = () => {
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  });
  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });
  after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
};

let counter = 0;
export const createUser = async ({ isAdmin = false, password = 'correct-horse-battery' } = {}) => {
  counter += 1;
  const email = `user${counter}@example.com`;
  await User.create({ name: `User ${counter}`, email, password, isAdmin });
  const res = await api().post('/api/users/signin').send({ email, password }).expect(200);
  return { ...res.body, password, auth: { Authorization: `Bearer ${res.body.token}` } };
};

export const createProduct = (overrides = {}) =>
  Product.create({
    name: 'Test Shirt',
    image: '/images/p1.jpg',
    brand: 'Nova',
    price: 40,
    category: 'Shirts',
    countInStock: 5,
    description: 'A shirt.',
    ...overrides,
  });

export const shipping = { address: '1 Main St', city: 'Pune', postalCode: '411001', country: 'IN' };
