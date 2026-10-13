const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  customDesignId: { type: String, default: null },
  designVersion: { type: Number, default: 1 },
  selectedSize: { type: String, required: true, enum: ['S', 'M', 'L', 'XL', 'XXL'] },
  selectedColor: {
    id: { type: String, default: 'white' },
    name: { type: String, default: 'Optic White' },
    hex: { type: String, default: '#FFFFFF' }
  },
  printLocations: { type: [String], default: ['front'] },
  previewImageUrl: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1, max: 20, default: 1 },
  unitPricePaise: { type: Number, required: true },
  lineTotalPaise: { type: Number, required: true }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  sessionId: { type: String, required: true, index: true },
  items: [cartItemSchema],
  subtotalPaise: { type: Number, default: 0 },
  appliedCoupon: {
    code: { type: String, default: null },
    discountPercentage: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
