const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { optionalAuth, requireAuth, requireAdmin } = require('../middleware/auth');

// Customer endpoints
router.get('/me', requireAuth, rewardController.getMyRewards);
router.post('/redeem', requireAuth, rewardController.redeemPoints);
router.post('/validate-referral', optionalAuth, rewardController.validateReferralCode);

// Admin endpoints
router.get('/admin/overview', requireAuth, requireAdmin, rewardController.getAdminRewardsOverview);
router.post('/admin/config', requireAuth, requireAdmin, rewardController.updateAdminConfig);
router.post('/admin/reverse-points', requireAuth, requireAdmin, rewardController.adminReversePoints);

module.exports = router;
