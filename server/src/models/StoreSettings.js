const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'BLANC ATELIER' },
  tagline: { type: String, default: 'Minimalist Combed Cotton & Print-on-Demand Studio' },
  contactEmail: { type: String, default: 'concierge@blancatelier.com' },
  supportPhone: { type: String, default: '+91 98765 43210' },
  whatsappNumber: { type: String, default: '919876543210' },
  currencyCode: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  lowStockThreshold: { type: Number, default: 5 },
  announcementText: { type: String, default: 'COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹1,499' },
  announcementEnabled: { type: Boolean, default: true },
  freeShippingThresholdPaise: { type: Number, default: 149900 },
  apparelGSTPercent: { type: Number, default: 5 },
  reviewAutoModerationThreshold: { type: Number, default: 3 },
  podAutoApprovalDPI: { type: Number, default: 200 }
}, {
  timestamps: true
});

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
