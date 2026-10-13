const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { optionalAuth, requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', optionalAuth, wishlistController.getWishlist);
router.post('/toggle', optionalAuth, wishlistController.toggleWishlist);
router.delete('/:productId', optionalAuth, wishlistController.removeFromWishlist);
router.post('/merge', requireAuth, wishlistController.mergeWishlist);
router.get('/analytics', requireAuth, requireAdmin, wishlistController.getWishlistStats);

module.exports = router;
