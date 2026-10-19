import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const env = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5001),
    MONGODB_URL: z.string().default('mongodb://127.0.0.1:27017/novastore'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGINS: z.string().default(''),
    PAYPAL_CLIENT_ID: z.string().default('sb'),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_API_BASE: z.url().default('https://api-m.sandbox.paypal.com'),
    UPLOAD_DIR: z.string().default('uploads'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default('us-east-1'),
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  })
  .parse(process.env);

const isProduction = env.NODE_ENV === 'production';

if (!env.JWT_SECRET && isProduction) {
  throw new Error('JWT_SECRET must be set in production');
}
if (!env.JWT_SECRET && env.NODE_ENV === 'development') {
  console.warn('JWT_SECRET not set: using a random secret, sessions reset on restart.');
}

const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction,
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  mongodbUrl: env.MONGODB_URL,
  jwt: {
    secret: env.JWT_SECRET ?? randomBytes(48).toString('hex'),
    expiresIn: env.JWT_EXPIRES_IN,
  },
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  paypal: {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    apiBase: env.PAYPAL_API_BASE,
  },
  uploads: {
    dir: env.UPLOAD_DIR,
    s3Bucket: env.S3_BUCKET,
    s3Region: env.S3_REGION,
  },
  authRateLimit: env.AUTH_RATE_LIMIT,
});

export default config;
