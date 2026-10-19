import mongoose from 'mongoose';
import { CATEGORY_SLUGS, DEPARTMENT_SLUGS, SIZES } from '../lib/catalog.js';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    department: { type: String, required: true, enum: DEPARTMENT_SLUGS, index: true },
    category: { type: String, required: true, enum: CATEGORY_SLUGS, index: true },
    sizes: { type: [{ type: String, enum: SIZES }], default: [] },
    color: { type: String, trim: true, maxlength: 40 },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true },
    rating: { type: Number, required: true, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, required: true, default: 0, min: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true },
);

/**
 * Updates `numReviews` and the average `rating` (one decimal) from the current reviews.
 * Call before saving after reviews change.
 */
productSchema.methods.recalculateRating = function recalculateRating() {
  this.numReviews = this.reviews.length;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = this.numReviews ? Math.round((total / this.numReviews) * 10) / 10 : 0;
};

export default mongoose.model('Product', productSchema);
