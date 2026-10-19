import mongoose from 'mongoose';

const shippingSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: { type: String, index: { unique: true, sparse: true } },
      status: String,
      payerID: String,
      verified: Boolean,
    },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  size: String,
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'An order needs at least one item.'],
    },
    shipping: { type: shippingSchema, required: true },
    payment: { type: paymentSchema, required: true },
    itemsPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Order', orderSchema);
