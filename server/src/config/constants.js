/**
 * Pricing & System Configuration for BLANC Atelier POD & Ecommerce
 * All monetary amounts are in integer paise (1 INR = 100 paise).
 */

module.exports = {
  // Fulfilment Modes: 'manual' (default) or 'automated' (when external provider is configured)
  FULFILLMENT_MODES: {
    MANUAL: 'manual',
    AUTOMATED: 'automated',
  },

  // POD Pricing Rules (in Paise)
  POD_PRICING: {
    BASE_CUSTOM_TEE_PAISE: 69900, // ₹699.00
    SINGLE_SIDE_PRINT_PAISE: 25000, // ₹250.00
    DOUBLE_SIDE_PRINT_PAISE: 45000, // ₹450.00 (Front + Back)
    SHIPPING_FEE_PAISE: 9900, // ₹99.00
    FREE_SHIPPING_THRESHOLD_PAISE: 149900, // ₹1,499.00
    GST_PERCENTAGE: 5, // 5% apparel GST in India
  },

  // Printable Area Dimensions (in inches & mm for standard A3/A4 garment printing)
  PRINT_SPECIFICATIONS: {
    MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024, // 15MB
    ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
    RECOMMENDED_MIN_DPI: 150,
    IDEAL_DPI: 300,
    PRINT_AREA_WIDTH_INCHES: 12.0,
    PRINT_AREA_HEIGHT_INCHES: 16.0,
    CANVAS_ASPECT_RATIO: 12 / 16, // 0.75
  },

  // Garment Colors Supported
  GARMENT_COLORS: [
    { id: 'white', name: 'Optic White', hex: '#FFFFFF', borderHex: '#E5E5E5', available: true },
    { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE', borderHex: '#E0DFD8', available: true },
    { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626', borderHex: '#1C1C1C', available: true },
    { id: 'black', name: 'Obsidian Black', hex: '#111111', borderHex: '#000000', available: true },
  ],

  // Garment Sizes
  GARMENT_SIZES: ['S', 'M', 'L', 'XL', 'XXL'],

  // Print Locations
  PRINT_LOCATIONS: {
    FRONT: 'front',
    BACK: 'back',
    BOTH: 'both'
  },

  // Order Fulfilment Statuses
  FULFILLMENT_STATUS: {
    PENDING_APPROVAL: 'pending_approval',
    ARTWORK_REJECTED: 'artwork_rejected',
    APPROVED: 'approved',
    IN_PRODUCTION: 'in_production',
    QUALITY_CHECKED: 'quality_checked',
    PACKED: 'packed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Payment Statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  }
};
