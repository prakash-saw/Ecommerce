const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true, default: 'percentage' },
  discountValue: { type: Number, required: true, min: 1 }, // percentage (e.g. 15 for 15%) or fixed paise (e.g. 20000 for ₹200)
  minOrderValuePaise: { type: Number, default: 0, min: 0 },
  maxDiscountPaise: { type: Number, default: null }, // for percentage discounts
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  usageLimit: { type: Number, default: null }, // global maximum redemptions (null = unlimited)
  perCustomerLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  firstOrderOnly: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'scheduled', 'expired', 'disabled'], default: 'active', index: true },
  canCombine: { type: Boolean, default: false },
  eligibleCategories: [{ type: String }],
  eligibleProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  redemptions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, default: '' },
    customerEmail: { type: String, lowercase: true, trim: true },
    discountPaise: { type: Number, required: true },
    redeemedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
