import { z } from 'zod';
import User from '../models/user.js';
import { signToken, isOwnerOrAdmin } from '../middleware/auth.js';
import { conflict, forbidden, notFound, unauthorized } from '../lib/httpError.js';

const email = z.email().trim().toLowerCase().max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(1).max(80);

export const signinSchema = z.object({ email, password: z.string().min(1).max(128) });
export const registerSchema = z.object({ name, email, password });
export const updateSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  // The profile form submits an empty string when the password is left unchanged.
  password: z.union([password, z.literal('')]).optional(),
});

const session = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token: signToken(user),
});

export const signin = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.verifyPassword(req.body.password))) {
    throw unauthorized('Invalid email or password.');
  }
  res.send(session(user));
};

export const register = async (req, res) => {
  if (await User.exists({ email: req.body.email })) {
    throw conflict('An account with this email already exists.');
  }
  const user = await User.create(req.body);
  res.status(201).send(session(user));
};

export const update = async (req, res) => {
  if (!isOwnerOrAdmin(req, req.params.id)) throw forbidden('You can only update your own account.');

  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw notFound('User not found.');

  const { name: newName, email: newEmail, password: newPassword } = req.body;
  if (newEmail && newEmail !== user.email && (await User.exists({ email: newEmail }))) {
    throw conflict('An account with this email already exists.');
  }
  if (newName) user.name = newName;
  if (newEmail) user.email = newEmail;
  if (newPassword) user.password = newPassword;
  await user.save();

  res.send(session(user));
};
