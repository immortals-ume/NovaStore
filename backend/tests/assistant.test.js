import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { api, createProduct, useDatabase } from './helpers.js';

// Loaded after helpers.js so the test environment (API key) is set before config is read.
const { runTool, setAssistantClient } = await import('../services/assistant.js');

/**
 * Fake Anthropic client: each call to `beta.messages.stream` takes the next scripted
 * reply. A script entry is a message, or a function of the request params returning one.
 * @param {Array<object | ((params: object) => object)>} script
 * @returns {{requests: object[]}} The client, which also records every request.
 */
const fakeClient = (script) => {
  const requests = [];
  return {
    requests,
    beta: {
      messages: {
        stream: (params) => {
          requests.push(structuredClone(params));
          const next = script.shift();
          const handlers = {};
          return {
            on(event, handler) {
              handlers[event] = handler;
              return this;
            },
            async finalMessage() {
              const message = typeof next === 'function' ? next(params) : next;
              if (message instanceof Error) throw message;
              for (const block of message.content) {
                if (block.type === 'text') handlers.text?.(block.text, block.text);
              }
              return message;
            },
          };
        },
      },
    },
  };
};

const reply = (content, stop_reason = 'end_turn') => ({ role: 'assistant', content, stop_reason });
const toolUse = (id, name, input) => ({ type: 'tool_use', id, name, input });

/**
 * Splits a server-sent events body into `{ event, data }` pairs.
 * @param {string} body
 * @returns {Array<{event: string, data: object}>}
 */
const parseEvents = (body) =>
  body
    .trim()
    .split('\n\n')
    .map((chunk) => {
      const [eventLine, dataLine] = chunk.split('\n');
      return { event: eventLine.slice('event: '.length), data: JSON.parse(dataLine.slice('data: '.length)) };
    });

const chat = (messages) => api().post('/api/assistant/chat').send({ messages });

describe('assistant', () => {
  useDatabase();
  afterEach(() => setAssistantClient(undefined));

  it('reports that it is enabled when an API key is configured', async () => {
    const res = await api().get('/api/assistant/status').expect(200);
    assert.deepEqual(res.body, { enabled: true });
  });

  it('rejects conversations that do not end with a shopper message', async () => {
    await chat([]).expect(400);
    await chat([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ]).expect(400);
  });

  it('searches the catalog, shows product cards and streams the answer', async () => {
    const shirt = await createProduct({ name: 'Linen Shirt', price: 59, sizes: ['M'] });
    await createProduct({ name: 'Wool Coat', price: 180, category: 'outerwear' });

    const client = fakeClient([
      reply([toolUse('t1', 'search_products', { query: 'linen', max_price: 100 })], 'tool_use'),
      (params) => {
        const result = JSON.parse(params.messages.at(-1).content[0].content);
        return reply([toolUse('t2', 'recommend_products', { product_ids: result.products.map((p) => p.id) })], 'tool_use');
      },
      reply([{ type: 'text', text: 'The Linen Shirt is $59.' }]),
    ]);
    setAssistantClient(client);

    const res = await chat([{ role: 'user', content: 'A linen shirt under $100?' }]).expect(200);
    assert.match(res.headers['content-type'], /text\/event-stream/);

    const events = parseEvents(res.text);
    const cards = events.find((e) => e.event === 'products').data.products;
    assert.deepEqual(cards.map((p) => p.name), ['Linen Shirt']);
    assert.equal(cards[0]._id, String(shirt._id));
    assert.equal(events.filter((e) => e.event === 'text').map((e) => e.data.delta).join(''), 'The Linen Shirt is $59.');
    assert.equal(events.at(-1).event, 'done');

    const searchResult = JSON.parse(client.requests[1].messages.at(-1).content[0].content);
    assert.equal(searchResult.total, 1);
    assert.equal(client.requests[0].model, 'claude-opus-5-5');
    assert.equal(client.requests[0].fallbacks, 'default');
  });

  it('replaces a refused reply with a polite message', async () => {
    setAssistantClient(fakeClient([reply([], 'refusal')]));
    const events = parseEvents((await chat([{ role: 'user', content: 'Something off-topic' }]).expect(200)).text);
    assert.match(events.find((e) => e.event === 'text').data.delta, /can't help with that/);
  });

  it('streams an error event when the model call fails', async () => {
    setAssistantClient(fakeClient([new Error('network down')]));
    const events = parseEvents((await chat([{ role: 'user', content: 'Hi' }]).expect(200)).text);
    assert.deepEqual(events.map((e) => e.event), ['error', 'done']);
  });

  it('returns tool errors to the model for invalid or unknown input', async () => {
    const emitted = [];
    const emit = (...args) => emitted.push(args);
    assert.equal((await runTool({ name: 'search_products', input: { max_price: -5 } }, emit)).is_error, true);
    assert.equal((await runTool({ name: 'get_product', input: { product_id: 'nope' } }, emit)).is_error, true);
    assert.equal((await runTool({ name: 'recommend_products', input: { product_ids: ['507f1f77bcf86cd799439011'] } }, emit)).is_error, true);
    assert.equal((await runTool({ name: 'delete_everything', input: {} }, emit)).is_error, true);
    assert.equal(emitted.length, 0);
  });
});
