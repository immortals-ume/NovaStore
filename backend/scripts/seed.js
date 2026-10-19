// Creates the admin account and, when the catalog is empty, sample products.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-secret' npm run seed [-- --reset-products]
import mongoose from 'mongoose';
import config from '../config.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import { PRODUCTS } from './catalogData.js';

// Interleave departments so "newest" listings show a mix rather than one department.
const byDepartment = Object.groupBy(PRODUCTS, (p) => p.department);
const longest = Math.max(...Object.values(byDepartment).map((list) => list.length));
const sampleProducts = Array.from({ length: longest }, (_, i) => Object.values(byDepartment).map((list) => list[longest - 1 - i]))
  .flat()
  .filter(Boolean)
  .map(({ colorKey: _colorKey, ...product }) => product);
const resetProducts = process.argv.includes('--reset-products');

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Store Admin' } = process.env;

await mongoose.connect(config.mongodbUrl);
try {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    const email = ADMIN_EMAIL.toLowerCase();
    const admin = (await User.findOne({ email })) ?? new User({ email, name: ADMIN_NAME });
    admin.password = ADMIN_PASSWORD;
    admin.isAdmin = true;
    await admin.save();
    console.log(`Admin ready: ${email}`);
  } else {
    console.log('Skipping admin: set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
  }

  if (resetProducts) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Removed ${deletedCount} existing products.`);
  }
  if (await Product.estimatedDocumentCount()) {
    console.log('Products already exist, skipping sample catalog.');
  } else {
    await Product.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} sample products.`);
  }
} finally {
  await mongoose.disconnect();
}
