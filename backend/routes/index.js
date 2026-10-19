import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate, validateId } from '../middleware/validate.js';
import * as users from '../controllers/users.js';
import * as products from '../controllers/products.js';
import * as orders from '../controllers/orders.js';
import * as uploads from '../controllers/uploads.js';

/**
 * Limits sign-in and registration attempts per IP to slow down password guessing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

/**
 * /api/users - sign in, register and update profile.
 */
const userRoutes = Router()
  .post('/signin', authLimiter, validate(users.signinSchema), users.signin)
  .post('/register', authLimiter, validate(users.registerSchema), users.register)
  .put('/:id', requireAuth, validateId(), validate(users.updateSchema), users.update);

/**
 * /api/products - public catalog reads; writes are admin-only, reviews need sign-in.
 */
const productRoutes = Router()
  .get('/', validate(products.listQuerySchema, 'query'), products.list)
  .get('/catalog', products.catalog)
  .get('/:id', validateId(), products.getById)
  .post('/', requireAuth, requireAdmin, validate(products.productSchema), products.create)
  .put('/:id', requireAuth, requireAdmin, validateId(), validate(products.productSchema), products.update)
  .delete('/:id', requireAuth, requireAdmin, validateId(), products.remove)
  .post('/:id/reviews', requireAuth, validateId(), validate(products.reviewSchema), products.addReview);

/**
 * /api/orders - all routes need sign-in; listing all, delivering and deleting are admin-only.
 */
const orderRoutes = Router()
  .use(requireAuth)
  .get('/', requireAdmin, orders.listAll)
  .get('/mine', orders.listMine)
  .post('/', validate(orders.createSchema), orders.create)
  .get('/:id', validateId(), orders.getById)
  .put('/:id/pay', validateId(), validate(orders.paySchema), orders.pay)
  .put('/:id/deliver', requireAdmin, validateId(), orders.deliver)
  .delete('/:id', requireAdmin, validateId(), orders.remove);

/**
 * /api/uploads - admin-only product image uploads.
 */
const uploadRoutes = Router()
  .use(requireAuth, requireAdmin)
  .post('/', uploads.parseImage, uploads.uploadLocal)
  .post('/s3', uploads.parseImage, uploads.uploadS3);

/**
 * All API routes, mounted at /api. Also exposes the public PayPal client id and a health check.
 */
export default Router()
  .use('/users', userRoutes)
  .use('/products', productRoutes)
  .use('/orders', orderRoutes)
  .use('/uploads', uploadRoutes)
  .get('/config/paypal', (_req, res) => res.send(config.paypal.clientId))
  .get('/health', (_req, res) => res.send({ status: 'ok' }));
