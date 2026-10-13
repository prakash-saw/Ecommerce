const mongoose = require('mongoose');

const designElementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['image', 'text'], required: true },
  // Image element fields
  assetId: { type: String, default: null },
  imageUrl: { type: String, default: null },
  originalFilename: { type: String, default: null },
  imageDpi: { type: Number, default: 300 },
  // Text element fields
  text: { type: String, default: '' },
  fontFamily: { type: String, default: 'Plus Jakarta Sans' },
  fontSize: { type: Number, default: 32 },
  colorHex: { type: String, default: '#111111' },
  textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  letterSpacing: { type: Number, default: 0 },
  isBold: { type: Boolean, default: false },
  isItalic: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  zIndex: { type: Number, default: 0 },
  // Transform & positioning within printable bounding box (percentages 0-100)
  xPercent: { type: Number, required: true, default: 50 },
  yPercent: { type: Number, required: true, default: 50 },
  scale: { type: Number, default: 1.0 },
  rotation: { type: Number, default: 0 },
  widthPercent: { type: Number, default: 40 },
  heightPercent: { type: Number, default: 40 }
}, { _id: false });

const sideDesignSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  elements: [designElementSchema],
  previewImageUrl: { type: String, default: '' },
  productionArtworkUrl: { type: String, default: '' }
}, { _id: false });

const customDesignSchema = new mongoose.Schema({
  designId: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true }, // userId or guestSessionId
  designName: { type: String, default: 'Custom T-Shirt Design', trim: true },
  garmentStyle: {
    type: String,
    enum: [
      'Oversized T-Shirt',
      'Regular Fit T-Shirt',
      'Polo T-Shirt',
      'Classic Round-Neck T-Shirt',
      'V-Neck T-Shirt',
      'Full-Sleeve T-Shirt',
      'Sleeveless T-Shirt',
      'Crop T-Shirt',
      'Hoodie',
      'Sweatshirt'
    ],
    default: 'Oversized T-Shirt'
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  version: { type: Number, default: 1 },
  selectedColor: {
    id: { type: String, default: 'white' },
    name: { type: String, default: 'Optic White' },
    hex: { type: String, default: '#FFFFFF' }
  },
  selectedSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], default: 'L' },
  pricePaise: { type: Number, default: 149900 },
  sides: {
    front: { type: sideDesignSchema, default: () => ({ enabled: true, elements: [] }) },
    back: { type: sideDesignSchema, default: () => ({ enabled: false, elements: [] }) }
  },
  previewThumbnail: { type: String, default: '' },
  validation: {
    isValid: { type: Boolean, default: true },
    warnings: [String],
    boundaryClipping: { type: Boolean, default: false },
    lowDpiDetected: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['draft', 'saved', 'ordered'], default: 'saved' },
  isLocked: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomDesign', customDesignSchema);
