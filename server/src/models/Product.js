const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  basePricePaise: { type: Number, required: true }, // in integer paise (e.g. 79900 = ₹799)
  compareAtPricePaise: { type: Number, default: null }, // optional original/strike-through price
  costPricePaise: { type: Number, default: null }, // internal cost of goods for margin calculation
  category: { type: String, required: true, default: 'ready_to_wear' },
  tags: [{ type: String, trim: true }],
  productType: {
    type: String,
    enum: ['ready_to_wear', 'custom_blank', 'limited_drop'],
    default: 'ready_to_wear',
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null },
  fabric: {
    gsm: { type: Number, default: 240 },
    material: { type: String, default: '100% Combed Organic Cotton' },
    fit: { type: String, default: 'Relaxed Boxy / Drop Shoulder' },
    finish: { type: String, default: 'Bio-Washed Pre-Shrunk Single Jersey' },
    care: { type: [String], default: ['Machine wash cold inside out', 'Do not iron on print', 'Dry in shade'] }
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    view: { type: String, enum: ['front', 'back', 'detail', 'model'], default: 'front' }
  }],
  isCustomizable: { type: Boolean, default: false },
  printableArea: {
    frontEnabled: { type: Boolean, default: true },
    backEnabled: { type: Boolean, default: true },
    widthInches: { type: Number, default: 12.0 },
    heightInches: { type: Number, default: 16.0 },
    topPercent: { type: Number, default: 25 },
    leftPercent: { type: Number, default: 28 },
    widthPercent: { type: Number, default: 44 },
    heightPercent: { type: Number, default: 56 }
  },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  sizeChart: [{
    size: { type: String, required: true },
    chestCm: { type: Number, required: true },
    lengthCm: { type: Number, required: true },
    shoulderCm: { type: Number, default: 0 },
    sleeveCm: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

productSchema.index({ isActive: 1, category: 1, basePricePaise: 1 });
productSchema.index({ isActive: 1, isCustomizable: 1, featured: -1 });
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  category: 'text',
  'fabric.fit': 'text',
  'fabric.material': 'text'
});

module.exports = mongoose.model('Product', productSchema);
