import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import config from '../config.js';
import { HttpError } from '../lib/httpError.js';
import { runAssistant } from '../services/assistant.js';

export const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(30)
    .refine((m) => m[0]?.role === 'user' && m.at(-1)?.role === 'user', {
      message: 'The conversation must start and end with a shopper message.',
    }),
});

/**
 * Picks the message to show the shopper when the assistant fails mid-reply.
 * @param {unknown} err
 * @returns {string}
 */
const failureMessage = (err) => {
  if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
    return 'The assistant is busy right now. Please try again in a moment.';
  }
  return 'Sorry, something went wrong. Please try again.';
};

/**
 * GET /api/assistant/status - Tells the storefront whether to show the chat widget.
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export const status = (_req, res) => {
  res.send({ enabled: config.assistant.enabled });
};

/**
 * POST /api/assistant/chat - Streams the shopping assistant's reply as server-sent events.
 * Events: `text` `{delta}`, `reset` `{chars}`, `products` `{products}`, `error` `{message}`, then `done`.
 * The model call is cancelled if the shopper disconnects.
 * @param {import('express').Request} req - `req.body.messages` is the conversation so far.
 * @param {import('express').Response} res
 * @throws {HttpError} 503 when no Anthropic API key is configured.
 */
export const chat = async (req, res) => {
  if (!config.assistant.enabled) throw new HttpError(503, 'The shopping assistant is not available.');

  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();

  const controller = new AbortController();
  res.on('close', () => controller.abort());
  const emit = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await runAssistant({ messages: req.body.messages, emit, signal: controller.signal });
  } catch (err) {
    if (!controller.signal.aborted) {
      if (!config.isTest) console.error('Assistant error:', err);
      emit('error', { message: failureMessage(err) });
    }
  }
  emit('done', {});
  res.end();
};
