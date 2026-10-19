import jwt from 'jsonwebtoken';
import config from '../config.js';
import { forbidden, unauthorized } from '../lib/httpError.js';

/**
 * Creates a signed JWT for a user, valid for the configured lifetime.
 * @param {{id: string, name: string, email: string, isAdmin: boolean}} user - The signed-in user.
 * @returns {string} The token the client sends as `Authorization: Bearer <token>`.
 */
export const signToken = (user) =>
  jwt.sign(
    { _id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' },
  );

/**
 * Middleware that rejects requests without a valid Bearer token and sets `req.user` from it.
 * @type {import('express').RequestHandler}
 */
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

/**
 * Middleware that only lets admins through. Must run after {@link requireAuth}.
 * @type {import('express').RequestHandler}
 */
export const requireAdmin = (req, _res, next) =>
  next(req.user?.isAdmin ? undefined : forbidden('Admin access required.'));

/**
 * Checks whether the current user owns a record or is an admin.
 * @param {import('express').Request} req - Request with `req.user` set by {@link requireAuth}.
 * @param {unknown} ownerId - The id of the user who owns the record.
 * @returns {boolean}
 */
export const isOwnerOrAdmin = (req, ownerId) =>
  Boolean(req.user?.isAdmin) || String(ownerId) === String(req.user?._id);
