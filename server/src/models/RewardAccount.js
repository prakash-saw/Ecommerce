const mongoose = require('mongoose');

const rewardAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  referralCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  pointsBalance: { type: Number, default: 0, min: 0 },
  lifetimePointsEarned: { type: Number, default: 0, min: 0 },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  history: [{
    type: { type: String, enum: ['purchase', 'referral_bonus', 'redemption', 'reversal'], required: true },
    points: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    note: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  }],
  referrals: [{
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['invited', 'pending', 'qualified', 'rewarded', 'cancelled'], default: 'pending' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    bonusAwarded: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardAccount', rewardAccountSchema);
