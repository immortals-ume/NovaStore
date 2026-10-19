import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate, validateId } from '../middleware/validate.js';
import * as users from '../controllers/users.js';
import * as products from '../controllers/products.js';
import * as orders from '../controllers/orders.js';
import * as uploads from '../controllers/uploads.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

const userRoutes = Router()
  .post('/signin', authLimiter, validate(users.signinSchema), users.signin)
  .post('/register', authLimiter, validate(users.registerSchema), users.register)
  .put('/:id', requireAuth, validateId(), validate(users.updateSchema), users.update);

const productRoutes = Router()
  .get('/', validate(products.listQuerySchema, 'query'), products.list)
  .get('/catalog', products.catalog)
  .get('/:id', validateId(), products.getById)
  .post('/', requireAuth, requireAdmin, validate(products.productSchema), products.create)
  .put('/:id', requireAuth, requireAdmin, validateId(), validate(products.productSchema), products.update)
  .delete('/:id', requireAuth, requireAdmin, validateId(), products.remove)
  .post('/:id/reviews', requireAuth, validateId(), validate(products.reviewSchema), products.addReview);

const orderRoutes = Router()
  .use(requireAuth)
  .get('/', requireAdmin, orders.listAll)
  .get('/mine', orders.listMine)
  .post('/', validate(orders.createSchema), orders.create)
  .get('/:id', validateId(), orders.getById)
  .put('/:id/pay', validateId(), validate(orders.paySchema), orders.pay)
  .put('/:id/deliver', requireAdmin, validateId(), orders.deliver)
  .delete('/:id', requireAdmin, validateId(), orders.remove);

const uploadRoutes = Router()
  .use(requireAuth, requireAdmin)
  .post('/', uploads.parseImage, uploads.uploadLocal)
  .post('/s3', uploads.parseImage, uploads.uploadS3);

export default Router()
  .use('/users', userRoutes)
  .use('/products', productRoutes)
  .use('/orders', orderRoutes)
  .use('/uploads', uploadRoutes)
  .get('/config/paypal', (_req, res) => res.send(config.paypal.clientId))
  .get('/health', (_req, res) => res.send({ status: 'ok' }));
