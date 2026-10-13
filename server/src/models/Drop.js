const mongoose = require('mongoose');

const dropSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  tagline: { type: String, default: '' },
  description: { type: String, required: true },
  bannerImage: { type: String, required: true },
  launchAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, default: null },
  isPublished: { type: Boolean, default: true, index: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    dropPricePaise: { type: Number, required: true },
    dropStockLimit: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 }
  }],
  subscribers: [{
    email: { type: String, lowercase: true, trim: true },
    subscribedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Drop', dropSchema);
