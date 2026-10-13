const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  razorpayOrderId: { type: String, required: true, index: true },
  razorpayPaymentId: { type: String, default: null, index: true },
  razorpaySignature: { type: String, default: null },
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'PREPAID'],
    default: 'PREPAID'
  },
  idempotencyKey: { type: String, unique: true, sparse: true },
  webhookEventId: { type: String, default: null },
  errorDescription: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
