const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

router.post('/create', requireAuth, orderController.createOrder);
router.post('/:id/retry-payment', requireAuth, orderController.retryPayment);
router.get('/my-orders', requireAuth, orderController.getCustomerOrders);
router.get('/track/:orderNumber', orderController.trackOrderByNumber);
router.get('/:id', requireAuth, orderController.getOrderById);

module.exports = router;
