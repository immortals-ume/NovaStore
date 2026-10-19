import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const BCRYPT_ROUNDS = 12;

/**
 * @param {string} value - A stored password.
 * @returns {boolean} True when the value is already a bcrypt hash.
 */
const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Hashes the password with bcrypt before saving whenever it was changed.
 */
userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password') && !isBcryptHash(this.password)) {
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  }
});

/**
 * Checks a password against the stored one.
 * Accounts created before hashing was added still hold plaintext passwords;
 * they are compared in constant time and upgraded to a bcrypt hash on that login.
 * @param {string} candidate - Password entered by the user.
 * @returns {Promise<boolean>} True when the password matches.
 */
userSchema.methods.verifyPassword = async function verifyPassword(candidate) {
  if (isBcryptHash(this.password)) return bcrypt.compare(candidate, this.password);

  const stored = Buffer.from(this.password);
  const given = Buffer.from(candidate);
  const matches = stored.length === given.length && timingSafeEqual(stored, given);
  if (matches) {
    // Same value as before, so it must be flagged explicitly for the hash hook to run.
    this.markModified('password');
    await this.save();
  }
  return matches;
};

export default mongoose.model('User', userSchema);
