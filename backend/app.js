import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const frontendBuild = path.resolve(import.meta.dirname, '../frontend/build');

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.isProduction ? 1 : false);
  // CSP stays off until the storefront's PayPal and CDN sources are audited.
  app.use(helmet({ contentSecurityPolicy: false }));
  if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRoutes);
  app.use('/api', notFoundHandler);

  app.use('/uploads', express.static(path.resolve(config.uploads.dir), { fallthrough: false }));

  if (existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
