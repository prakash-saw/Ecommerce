const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, default: '', trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, default: 'IN', trim: true },
  label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  deliveryInstructions: { type: String, default: '', trim: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '', trim: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  addresses: [addressSchema],
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
