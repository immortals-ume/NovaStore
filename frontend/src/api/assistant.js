import { ApiError } from './client.js';

/**
 * Sends the conversation to the shopping assistant and reads its streamed reply.
 * @param {Array<{role: 'user' | 'assistant', content: string}>} messages - Conversation ending with the shopper's message.
 * @param {object} options
 * @param {(event: string, data: object) => void} options.onEvent - Called for each `text`, `reset`, `products`, `error` and `done` event.
 * @param {AbortSignal} [options.signal] - Abort to stop the reply.
 * @returns {Promise<void>} Resolves when the reply is complete.
 * @throws {ApiError} When the request is rejected (e.g. rate limited or the assistant is off).
 */
export const streamChat = async (messages, { onEvent, signal }) => {
  const res = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message ?? 'The assistant is unavailable.', data.details);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    // Events are separated by a blank line; keep any incomplete event for the next chunk.
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop();
    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.*)$/m)?.[1];
      const data = chunk.match(/^data: (.*)$/m)?.[1];
      if (event && data) onEvent(event, JSON.parse(data));
    }
  }
};
