const mongoose = require('mongoose');

const rewardConfigSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  pointsPerHundredRupees: { type: Number, default: 5 }, // 5 points per ₹100 spent (5% return)
  referrerBonusPoints: { type: Number, default: 150 }, // 150 points (~₹150) for qualified referral
  referredDiscountPercent: { type: Number, default: 10 }, // 10% discount for friend using referral code
  minOrderValuePaise: { type: Number, default: 99900 }, // min ₹999 order value to redeem/qualify
  pointsToRupeeRatio: { type: Number, default: 1 }, // 1 point = ₹1
  maxRedemptionDiscountPercent: { type: Number, default: 30 }, // max 30% off total cart to protect margins
  coupons: [{
    code: { type: String, required: true, uppercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    discountPaise: { type: Number, required: true },
    minOrderValuePaise: { type: Number, default: 99900 },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardConfig', rewardConfigSchema);
