import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { api, createUser, useDatabase, User } from './helpers.js';

describe('users', () => {
  useDatabase();

  it('registers with a hashed password and never returns it', async () => {
    const res = await api()
      .post('/api/users/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'long-enough-pw' })
      .expect(201);

    assert.equal(res.body.email, 'asha@example.com');
    assert.equal(res.body.isAdmin, false);
    assert.ok(res.body.token);
    assert.equal(res.body.password, undefined);

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    assert.match(stored.password, /^\$2[aby]\$/);
  });

  it('rejects duplicate emails and weak passwords', async () => {
    const user = await createUser();
    await api().post('/api/users/register').send({ name: 'X', email: user.email, password: 'long-enough-pw' }).expect(409);
    await api().post('/api/users/register').send({ name: 'X', email: 'new@example.com', password: '123' }).expect(400);
  });

  it('cannot be tricked into granting admin at registration', async () => {
    const res = await api()
      .post('/api/users/register')
      .send({ name: 'Eve', email: 'eve@example.com', password: 'long-enough-pw', isAdmin: true })
      .expect(201);
    assert.equal(res.body.isAdmin, false);
  });

  it('rejects wrong passwords and operator-injection logins', async () => {
    const user = await createUser({ isAdmin: true });
    await api().post('/api/users/signin').send({ email: user.email, password: 'wrong-password' }).expect(401);
    await api().post('/api/users/signin').send({ email: user.email, password: { $ne: null } }).expect(400);
    await api().post('/api/users/signin').send({ email: { $gt: '' }, password: 'x' }).expect(400);
  });

  it('upgrades legacy plaintext passwords on first login', async () => {
    await User.collection.insertOne({ name: 'Old', email: 'old@example.com', password: 'legacy1234', isAdmin: false });
    await api().post('/api/users/signin').send({ email: 'old@example.com', password: 'legacy1234' }).expect(200);

    const stored = await User.findOne({ email: 'old@example.com' }).select('+password');
    assert.match(stored.password, /^\$2[aby]\$/);
    await api().post('/api/users/signin').send({ email: 'old@example.com', password: 'legacy1234' }).expect(200);
  });

  it('rejects tokens signed with the old default secret', async () => {
    const forged = jwt.sign({ _id: 'x', isAdmin: true }, 'somethingsecret');
    await api().get('/api/orders').set('Authorization', `Bearer ${forged}`).expect(401);
  });

  it('lets users update only their own profile', async () => {
    const alice = await createUser();
    const bob = await createUser();

    await api().put(`/api/users/${bob._id}`).set(alice.auth).send({ password: 'hijacked-password' }).expect(403);

    const res = await api().put(`/api/users/${alice._id}`).set(alice.auth).send({ name: 'Alice B', password: '' }).expect(200);
    assert.equal(res.body.name, 'Alice B');
    await api().post('/api/users/signin').send({ email: alice.email, password: alice.password }).expect(200);
  });

  it('no longer exposes the createadmin backdoor', async () => {
    await api().get('/api/users/createadmin').expect(404);
  });
});
