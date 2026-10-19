import jwt from 'jsonwebtoken';
import config from '../config.js';
import { forbidden, unauthorized } from '../lib/httpError.js';

export const signToken = (user) =>
  jwt.sign(
    { _id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' },
  );

export const requireAuth = (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(unauthorized('Token is not supplied.'));
  }
  try {
    req.user = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token.'));
  }
};

export const requireAdmin = (req, _res, next) =>
  next(req.user?.isAdmin ? undefined : forbidden('Admin access required.'));

export const isOwnerOrAdmin = (req, ownerId) =>
  Boolean(req.user?.isAdmin) || String(ownerId) === String(req.user?._id);
