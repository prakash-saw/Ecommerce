const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const podAdminController = require('../controllers/podAdminController');
const { requireAdmin } = require('../middleware/auth');

// ==========================================
// 1. ANALYTICS & OVERVIEW
// ==========================================
router.get('/analytics/overview', requireAdmin, adminController.getAnalyticsOverview);

// ==========================================
// 2. PRODUCT MANAGEMENT
// ==========================================
router.get('/products', requireAdmin, adminController.getAdminProducts);
router.post('/products', requireAdmin, adminController.createProduct);
router.get('/products/:id', requireAdmin, adminController.getAdminProductById);
router.put('/products/:id', requireAdmin, adminController.updateProduct);
router.delete('/products/:id', requireAdmin, adminController.archiveProduct);
router.patch('/products/bulk', requireAdmin, adminController.bulkUpdateProducts);

// ==========================================
// 3. ORDER MANAGEMENT
// ==========================================
router.get('/orders', requireAdmin, adminController.getAdminOrders);
router.get('/orders/:id', requireAdmin, adminController.getAdminOrderById);
router.patch('/orders/:id/status', requireAdmin, adminController.updateOrderStatus);
router.patch('/orders/:id/fulfilment', requireAdmin, podAdminController.updateOrderFulfilment); // Backwards compatibility
router.post('/orders/:id/notes', requireAdmin, adminController.addOrderNote);
router.post('/orders/:id/cancel', requireAdmin, adminController.cancelOrder);

// ==========================================
// 4. INVENTORY MANAGEMENT
// ==========================================
router.get('/inventory', requireAdmin, adminController.getAdminInventory);
router.post('/inventory/adjust', requireAdmin, adminController.adjustInventory);
router.get('/inventory/movements', requireAdmin, adminController.getInventoryMovements);

// ==========================================
// 5. COUPONS & PROMOTIONS
// ==========================================
router.get('/coupons', requireAdmin, adminController.getAdminCoupons);
router.post('/coupons', requireAdmin, adminController.createCoupon);
router.put('/coupons/:id', requireAdmin, adminController.updateCoupon);
router.delete('/coupons/:id', requireAdmin, adminController.deleteCoupon);

// ==========================================
// 6. REVIEWS & CUSTOMER SUPPORT
// ==========================================
router.get('/reviews', requireAdmin, adminController.getAdminReviews);
router.patch('/reviews/:id/moderate', requireAdmin, adminController.moderateReview);

router.get('/support/tickets', requireAdmin, adminController.getSupportTickets);
router.patch('/support/tickets/:id', requireAdmin, adminController.updateSupportTicket);
router.post('/support/tickets/:id/notes', requireAdmin, adminController.addSupportTicketNote);

// ==========================================
// 7. COLLECTIONS & DROPS
// ==========================================
router.get('/collections', requireAdmin, adminController.getAdminCollections);
router.post('/collections', requireAdmin, adminController.createCollection);
router.put('/collections/:id', requireAdmin, adminController.updateCollection);
router.delete('/collections/:id', requireAdmin, adminController.deleteCollection);

// ==========================================
// 8. STORE SETTINGS & AUDIT
// ==========================================
router.get('/settings', requireAdmin, adminController.getStoreSettings);
router.put('/settings', requireAdmin, adminController.updateStoreSettings);

// ==========================================
// 9. POD PRE-PRESS QUEUE (Preserved)
// ==========================================
router.get('/pod-queue', requireAdmin, podAdminController.getPODQueue);
router.get('/pod-queue/:id', requireAdmin, podAdminController.getPODJobDetails);
router.post('/pod-queue/:id/approve', requireAdmin, podAdminController.approveJob);
router.post('/pod-queue/:id/reject', requireAdmin, podAdminController.rejectJob);
router.patch('/pod-queue/:id/status', requireAdmin, podAdminController.updateJobStatus);

module.exports = router;
