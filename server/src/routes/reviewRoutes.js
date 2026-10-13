const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { optionalAuth, requireAuth, requireAdmin } = require('../middleware/auth');

// Public review fetching with optional auth to check user review eligibility
router.get('/product/:productId', optionalAuth, reviewController.getProductReviews);

// Customer review actions (authenticated)
router.post('/', requireAuth, reviewController.createReview);
router.put('/:reviewId', requireAuth, reviewController.updateReview);
router.delete('/:reviewId', requireAuth, reviewController.deleteReview);
router.post('/:reviewId/report', optionalAuth, reviewController.reportReview);

// Admin moderation
router.get('/admin/all', requireAuth, requireAdmin, reviewController.getAdminReviews);
router.post('/admin/:reviewId/toggle-visibility', requireAuth, requireAdmin, reviewController.toggleReviewVisibility);

module.exports = router;
