const express = require('express');
const router = express.Router();
const podAdminController = require('../controllers/podAdminController');
const { requireAdmin } = require('../middleware/auth');

// POD Production Queue
router.get('/pod-queue', requireAdmin, podAdminController.getPODQueue);
router.get('/pod-queue/:id', requireAdmin, podAdminController.getPODJobDetails);
router.post('/pod-queue/:id/approve', requireAdmin, podAdminController.approveJob);
router.post('/pod-queue/:id/reject', requireAdmin, podAdminController.rejectJob);
router.patch('/pod-queue/:id/status', requireAdmin, podAdminController.updateJobStatus);

// Order Management
router.get('/orders', requireAdmin, podAdminController.getAllOrders);
router.patch('/orders/:id/fulfilment', requireAdmin, podAdminController.updateOrderFulfilment);

// System Settings
router.get('/settings', requireAdmin, podAdminController.getSettings);

module.exports = router;
