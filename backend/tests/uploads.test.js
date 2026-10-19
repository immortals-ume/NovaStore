import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { api, createUser, useDatabase } from './helpers.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('uploads', () => {
  useDatabase();

  it('requires an admin', async () => {
    await api().post('/api/uploads').attach('image', PNG, 'a.png').expect(401);
    const user = await createUser();
    await api().post('/api/uploads').set(user.auth).attach('image', PNG, 'a.png').expect(403);
  });

  it('stores real images under a random name and serves them', async () => {
    const admin = await createUser({ isAdmin: true });
    const res = await api().post('/api/uploads').set(admin.auth).attach('image', PNG, 'evil.php').expect(201);
    assert.match(res.text, /^\/uploads\/[\da-f-]{36}\.png$/);

    const file = await api().get(res.text).expect(200);
    assert.equal(file.headers['content-type'], 'image/png');
  });

  it('rejects files that are not images, whatever they claim to be', async () => {
    const admin = await createUser({ isAdmin: true });
    await api()
      .post('/api/uploads')
      .set(admin.auth)
      .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'x.png', contentType: 'image/png' })
      .expect(400);
    await api().get('/uploads/missing.png').expect(404);
  });
});
