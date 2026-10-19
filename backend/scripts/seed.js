// Creates the admin account and, when the catalog is empty, sample products.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-secret' npm run seed
import mongoose from 'mongoose';
import config from '../config.js';
import User from '../models/user.js';
import Product from '../models/product.js';

const sampleProducts = [
  { name: 'Classic Oxford Shirt', category: 'Shirts', brand: 'Nova Basics', price: 49, countInStock: 25, image: '/images/p1.jpg', description: 'Crisp cotton oxford with a button-down collar. Works from desk to dinner.' },
  { name: 'Linen Camp Shirt', category: 'Shirts', brand: 'Coastline', price: 59, countInStock: 18, image: '/images/p2.jpg', description: 'Breathable linen in a relaxed fit, made for warm days.' },
  { name: 'Slim Stretch Tee', category: 'Shirts', brand: 'Nova Basics', price: 24, countInStock: 60, image: '/images/p3.jpg', description: 'Soft cotton-elastane tee that keeps its shape wash after wash.' },
  { name: 'Tapered Chinos', category: 'Pants', brand: 'Urban Thread', price: 69, countInStock: 30, image: '/images/d1.jpg', description: 'Everyday chinos with a modern tapered leg and a touch of stretch.' },
  { name: 'Relaxed Denim', category: 'Pants', brand: 'Indigo Mill', price: 89, countInStock: 22, image: '/images/d2.jpg', description: 'Mid-weight denim in a relaxed straight fit, garment washed for softness.' },
  { name: 'Tech Joggers', category: 'Pants', brand: 'Coastline', price: 79, countInStock: 0, image: '/images/d3.jpg', description: 'Water-repellent joggers with zip pockets for travel and training.' },
];

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

  if (await Product.estimatedDocumentCount()) {
    console.log('Products already exist, skipping sample catalog.');
  } else {
    await Product.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} sample products.`);
  }
} finally {
  await mongoose.disconnect();
}
