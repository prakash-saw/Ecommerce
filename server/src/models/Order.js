const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  customDesignId: { type: String, default: null },
  designVersion: { type: Number, default: 1 },
  selectedSize: { type: String, required: true },
  selectedColor: {
    id: String,
    name: String,
    hex: String
  },
  printLocations: [String],
  previewImageUrl: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unitPricePaise: { type: Number, required: true },
  lineTotalPaise: { type: Number, required: true },
  // Captured production export snapshot
  productionSpecs: {
    frontArtworkUrl: String,
    backArtworkUrl: String,
    printWidthInches: Number,
    printHeightInches: Number
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  items: [orderItemSnapshotSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'IN' },
    label: { type: String, default: 'Home' },
    deliveryInstructions: { type: String, default: '' }
  },
  pricing: {
    subtotalPaise: { type: Number, required: true },
    printingFeePaise: { type: Number, default: 0 },
    shippingFeePaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    totalAmountPaise: { type: Number, required: true }
  },
  orderStatus: {
    type: String,
    enum: [
      'PENDING_PAYMENT',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'EXPIRED',
      'REFUND_PENDING',
      'REFUNDED'
    ],
    default: 'PENDING_PAYMENT',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: [
      'UNPAID',
      'PENDING',
      'PAID',
      'FAILED',
      'CANCELLED',
      'REFUND_PENDING',
      'PARTIALLY_REFUNDED',
      'REFUNDED'
    ],
    default: 'PENDING',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'PREPAID'],
    default: 'PREPAID',
    index: true
  },
  orderExpiresAt: {
    type: Date,
    default: null
  },
  payment: {
    provider: { type: String, default: 'razorpay' },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null }
  },
  fulfilmentStatus: {
    type: String,
    enum: [
      'pending_approval',
      'artwork_rejected',
      'approved',
      'processing',
      'in_production',
      'quality_checked',
      'packed',
      'shipped',
      'delivered',
      'cancelled'
    ],
    default: 'pending_approval'
  },
  tracking: {
    carrier: { type: String, default: 'BlueDart / Delhivery' },
    trackingNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    shippedAt: { type: Date, default: null }
  },
  rejectionReason: { type: String, default: '' },
  appliedReferralCode: { type: String, default: null },
  couponCode: { type: String, default: null },
  auditLog: [{
    actor: { type: String, default: 'System' },
    action: { type: String, required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
