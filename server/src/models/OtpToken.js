const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'forgot_password'],
    required: true
  },
  // Stored during signup so user is created only after OTP verification.
  // password is encrypted beforehand with bcrypt, NEVER plaintext!
  pendingUserData: {
    name: { type: String, trim: true },
    passwordHash: { type: String },
    phone: { type: String, trim: true }
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  expiresAt: {
    type: Date,
    required: true
  },
  resendAvailableAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  // Issued after OTP verification for forgot_password to authenticate reset
  resetTokenHash: {
    type: String,
    default: null
  },
  resetTokenExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// TTL index to automatically purge expired records
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
otpTokenSchema.index({ email: 1, purpose: 1, isUsed: 1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
