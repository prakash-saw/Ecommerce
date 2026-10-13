const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  provider: { type: String, required: true, default: 'razorpay' },
  eventType: { type: String, required: true },
  payload: { type: Object, required: true },
  isProcessed: { type: Boolean, default: false },
  processedAt: { type: Date, default: null },
  errorMessage: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
