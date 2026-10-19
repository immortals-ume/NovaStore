import mongoose from 'mongoose';
import { z } from 'zod';
import { notFound } from '../lib/httpError.js';

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), 'Invalid id');

/**
 * Middleware that parses `req[source]` with a zod schema and replaces it with the parsed value.
 * Express 5 makes `req.query` read-only, so parsed queries go to `req.validatedQuery`.
 * Invalid input throws a ZodError, which the error handler returns as a 400.
 * @param {import('zod').ZodType} schema - Schema to validate against.
 * @param {'body' | 'query' | 'params'} [source] - Which part of the request to validate.
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.parse(req[source] ?? {});
  if (source === 'query') req.validatedQuery = parsed;
  else req[source] = parsed;
  next();
};

/**
 * Middleware that checks a route parameter is a MongoDB ObjectId.
 * Unknown or malformed ids are reported as 404 rather than leaking a cast error.
 * @param {string} [param] - Name of the route parameter.
 * @returns {import('express').RequestHandler}
 */
export const validateId = (param = 'id') => (req, _res, next) =>
  next(objectId.safeParse(req.params[param]).success ? undefined : notFound());
