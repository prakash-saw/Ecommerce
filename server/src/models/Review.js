const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  customerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  photos: [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: false, index: true },
  verifiedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  isHidden: { type: Boolean, default: false, index: true },
  moderationNotes: { type: String, default: '' },
  reportCount: { type: Number, default: 0 },
  reports: [{
    reason: { type: String, required: true },
    reportedBy: { type: String, default: 'anonymous' },
    reportedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Enforce one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
