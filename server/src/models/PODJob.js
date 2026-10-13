const mongoose = require('mongoose');

const podJobSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  orderNumber: { type: String, required: true },
  customDesignId: { type: String, required: true, index: true },
  designVersion: { type: Number, default: 1 },
  productName: { type: String, required: true },
  selectedSize: { type: String, required: true },
  selectedColor: {
    id: String,
    name: String,
    hex: String
  },
  quantity: { type: Number, required: true, default: 1 },
  printLocations: [String],
  
  // Production files & spec sheet
  productionArtwork: {
    frontHighResUrl: { type: String, default: '' },
    backHighResUrl: { type: String, default: '' },
    previewThumbnail: { type: String, default: '' },
    manifestUrl: { type: String, default: '' }
  },

  // Fulfilment mode: 'manual' (default) or 'automated'
  providerMode: { type: String, enum: ['manual', 'automated'], default: 'manual' },
  
  // Manual queue review fields
  productionStatus: {
    type: String,
    enum: [
      'pending_review',
      'approved',
      'rejected',
      'printing',
      'quality_passed',
      'completed',
      'failed'
    ],
    default: 'pending_review'
  },
  reviewNotes: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null },

  // Automated provider interface mappings (for future integrations)
  providerDetails: {
    providerName: { type: String, default: 'Internal Local Atelier' },
    providerOrderId: { type: String, default: null },
    providerStatus: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    rawResponse: { type: Object, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PODJob', podJobSchema);
