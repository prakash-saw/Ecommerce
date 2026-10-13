const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  featuredOnHome: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Collection', collectionSchema);
