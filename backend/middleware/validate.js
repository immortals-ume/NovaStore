import mongoose from 'mongoose';
import { z } from 'zod';
import { notFound } from '../lib/httpError.js';

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), 'Invalid id');

// Parses req[source] with a zod schema and replaces it with the parsed value.
// Express 5 makes req.query a getter, so parsed queries go to req.validatedQuery.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.parse(req[source] ?? {});
  if (source === 'query') req.validatedQuery = parsed;
  else req[source] = parsed;
  next();
};

// Unknown or malformed ids are reported as 404 rather than leaking a cast error.
export const validateId = (param = 'id') => (req, _res, next) =>
  next(objectId.safeParse(req.params[param]).success ? undefined : notFound());
