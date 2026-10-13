const mongoose = require('mongoose');

const designAssetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true, index: true },
  storagePath: { type: String, required: true },
  publicUrl: { type: String, required: true },
  originalFilename: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    dpi: { type: Number, default: 300 }
  },
  checksum: { type: String, default: '' },
  uploadOwner: { type: String, required: true, index: true } // userId or guestSessionId
}, {
  timestamps: true
});

module.exports = mongoose.model('DesignAsset', designAssetSchema);
