const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, cartController.getCart);
router.post('/add', optionalAuth, cartController.addToCart);
router.put('/update-quantity', optionalAuth, cartController.updateQuantity);
router.delete('/item/:itemId', optionalAuth, cartController.removeItem);
router.post('/coupon', optionalAuth, cartController.applyCoupon);

module.exports = router;
