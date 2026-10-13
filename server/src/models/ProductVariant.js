const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  size: { type: String, required: true, enum: ['S', 'M', 'L', 'XL', 'XXL'] },
  color: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    hex: { type: String, required: true },
    garmentImageFront: { type: String, default: '' },
    garmentImageBack: { type: String, default: '' }
  },
  stockQuantity: { type: Number, required: true, min: 0, default: 25 },
  priceOverridePaise: { type: Number, default: null }, // Optional size/color surcharge
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

productVariantSchema.index({ productId: 1, isActive: 1 });
productVariantSchema.index({ productId: 1, size: 1, isActive: 1 });
productVariantSchema.index({ size: 1, isActive: 1, stockQuantity: 1 });
productVariantSchema.index({ 'color.id': 1, isActive: 1, stockQuantity: 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
