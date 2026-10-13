const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  customerPhone: { type: String, default: '', trim: true },
  category: {
    type: String,
    enum: ['sizing', 'availability', 'shipping', 'returns', 'pod_customization', 'payment', 'general'],
    default: 'general',
    index: true
  },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  orderNumber: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  assignedAdminEmail: { type: String, default: null },
  internalNotes: [{
    text: { type: String, required: true },
    authorEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
