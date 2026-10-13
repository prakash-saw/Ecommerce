const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  sku: { type: String, required: true, index: true },
  productName: { type: String, default: '' },
  variantDetails: { type: String, default: '' }, // e.g. "Size: L / Optic White"
  previousQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  changeQuantity: { type: Number, required: true }, // positive for additions, negative for deductions
  reason: {
    type: String,
    enum: [
      'purchase',
      'order_sale',
      'restock',
      'physical_audit',
      'damage',
      'order_cancellation',
      'order_return',
      'manual_adjustment'
    ],
    required: true,
    index: true
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  orderNumber: { type: String, default: '' },
  adminEmail: { type: String, default: 'system' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
