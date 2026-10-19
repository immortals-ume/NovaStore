import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const BCRYPT_ROUNDS = 12;
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

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password') && !isBcryptHash(this.password)) {
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  }
});

// Accounts created before hashing was added still hold plaintext passwords;
// they are verified once and upgraded to a bcrypt hash on that login.
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
