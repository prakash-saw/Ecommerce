const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { optionalAuth, requireAuth, requireVerifiedEmail } = require('../middleware/auth');

router.post('/create', requireAuth, requireVerifiedEmail, orderController.createOrder);
router.post('/:id/retry-payment', requireAuth, requireVerifiedEmail, orderController.retryPayment);
router.get('/my-orders', requireAuth, orderController.getCustomerOrders);
router.get('/track/:orderNumber', orderController.trackOrderByNumber);
router.get('/:id', requireAuth, orderController.getOrderById);

module.exports = router;
