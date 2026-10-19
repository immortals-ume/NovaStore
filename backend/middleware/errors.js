import { STATUS_CODES } from 'node:http';
import multer from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import config from '../config.js';
import { HttpError } from '../lib/httpError.js';

/**
 * Responds 404 with a JSON message for any route that did not match.
 * @type {import('express').RequestHandler}
 */
export const notFoundHandler = (req, res) => {
  res.status(404).send({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Turns any thrown error into a JSON response shaped `{ message, details? }`.
 * Known errors (validation, HttpError, upload, database) keep their meaning;
 * anything unexpected is logged and returned as a generic 500.
 * @type {import('express').ErrorRequestHandler}
 */
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).send({
      message: 'Invalid request data.',
      details: err.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).send({ message: err.message, details: err.details });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).send({ message: err.message });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).send({ message: err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).send({ message: 'Not found.' });
  }
  if (err?.code === 11000) {
    return res.status(409).send({ message: 'A record with these details already exists.' });
  }
  // Client errors raised by Express itself (bad JSON, body too large, missing static file).
  // Non-exposed ones (e.g. ENOENT with a server path) get the generic status text instead.
  if (err?.status >= 400 && err.status < 500) {
    return res.status(err.status).send({ message: err.expose ? err.message : STATUS_CODES[err.status] });
  }

  if (!config.isTest) console.error(err);
  return res.status(500).send({ message: 'Something went wrong. Please try again.' });
};
