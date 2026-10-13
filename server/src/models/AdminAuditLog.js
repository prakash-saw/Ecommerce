const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: String, default: null },
  details: { type: Object, default: {} },
  ipAddress: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
