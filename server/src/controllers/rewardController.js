const crypto = require('crypto');
const RewardAccount = require('../models/RewardAccount');
const RewardConfig = require('../models/RewardConfig');
const User = require('../models/User');
const Order = require('../models/Order');

// Helper to get or initialize default reward configuration
const getOrCreateConfig = async () => {
  let config = await RewardConfig.findOne();
  if (!config) {
    config = new RewardConfig({
      isActive: true,
      pointsPerHundredRupees: 5, // 5 points per ₹100 spent
      referrerBonusPoints: 150, // 150 points for referrer
      referredDiscountPercent: 10, // 10% off for friend
      minOrderValuePaise: 99900, // ₹999 min order
      pointsToRupeeRatio: 1, // 1 point = ₹1
      maxRedemptionDiscountPercent: 30,
      coupons: []
    });
    await config.save();
  }
  return config;
};

// Generate a memorable unique code like BLANC-K7M9
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BLANC-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get or initialize customer reward account
const getOrCreateAccount = async (userId) => {
  let account = await RewardAccount.findOne({ userId });
  if (!account) {
    let uniqueCode = generateReferralCode();
    // Ensure uniqueness
    while (await RewardAccount.findOne({ referralCode: uniqueCode })) {
      uniqueCode = generateReferralCode();
    }

    account = new RewardAccount({
      userId,
      referralCode: uniqueCode,
      pointsBalance: 50, // Welcome gift of 50 points (₹50)
      lifetimePointsEarned: 50,
      history: [{
        type: 'referral_bonus',
        points: 50,
        note: 'Welcome to BLANC Atelier Rewards Circle (Complimentary Credit)'
      }]
    });
    await account.save();
  }
  return account;
};

// GET /api/rewards/me
exports.getMyRewards = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const account = await getOrCreateAccount(req.user._id);
    await account.populate('referrals.referredUser', 'name email');

    // Filter active coupons for this user
    const userCoupons = config.coupons
      .filter(c => c.userId.toString() === req.user._id.toString() && !c.isUsed && new Date(c.expiresAt) > new Date());

    res.json({
      success: true,
      account: {
        pointsBalance: account.pointsBalance,
        lifetimePointsEarned: account.lifetimePointsEarned,
        monetaryValueRupees: account.pointsBalance * config.pointsToRupeeRatio,
        referralCode: account.referralCode,
        history: account.history.sort((a, b) => new Date(b.date) - new Date(a.date)),
        referrals: account.referrals.sort((a, b) => new Date(b.date) - new Date(a.date))
      },
      availableCoupons: userCoupons,
      config: {
        isActive: config.isActive,
        pointsPerHundredRupees: config.pointsPerHundredRupees,
        referrerBonusPoints: config.referrerBonusPoints,
        referredDiscountPercent: config.referredDiscountPercent,
        minOrderValuePaise: config.minOrderValuePaise,
        pointsToRupeeRatio: config.pointsToRupeeRatio,
        maxRedemptionDiscountPercent: config.maxRedemptionDiscountPercent
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rewards/redeem
exports.redeemPoints = async (req, res) => {
  try {
    const { pointsToRedeem } = req.body;
    const pointsNum = Number(pointsToRedeem);

    if (isNaN(pointsNum) || pointsNum < 50) {
      return res.status(400).json({ success: false, message: 'Minimum redemption is 50 points (₹50).' });
    }

    const config = await getOrCreateConfig();
    if (!config.isActive) {
      return res.status(400).json({ success: false, message: 'Rewards program is currently paused.' });
    }

    const account = await RewardAccount.findOne({ userId: req.user._id });
    if (!account || account.pointsBalance < pointsNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${account ? account.pointsBalance : 0} points available.`
      });
    }

    // Deduct points atomically
    account.pointsBalance -= pointsNum;

    // Generate coupon code
    const couponCode = `REW-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const discountPaise = pointsNum * config.pointsToRupeeRatio * 100;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30-day coupon validity

    account.history.push({
      type: 'redemption',
      points: -pointsNum,
      couponCode,
      note: `Redeemed ${pointsNum} points for a ₹${pointsNum * config.pointsToRupeeRatio} voucher`
    });
    await account.save();

    config.coupons.push({
      code: couponCode,
      userId: req.user._id,
      discountPaise,
      minOrderValuePaise: config.minOrderValuePaise,
      isUsed: false,
      expiresAt: expiryDate
    });
    await config.save();

    res.json({
      success: true,
      message: `Successfully redeemed ${pointsNum} points for voucher ${couponCode}!`,
      coupon: {
        code: couponCode,
        discountPaise,
        discountRupees: discountPaise / 100,
        expiresAt: expiryDate,
        minOrderValuePaise: config.minOrderValuePaise
      },
      newBalance: account.pointsBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rewards/validate-referral (Validates referral code during signup or checkout)
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const referrerAccount = await RewardAccount.findOne({ referralCode: cleanCode });
    if (!referrerAccount) {
      return res.status(404).json({ success: false, message: 'Invalid referral code.' });
    }

    // Anti-self-referral prevention
    if (req.user && referrerAccount.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot use your own referral code.' });
    }

    const config = await getOrCreateConfig();

    res.json({
      success: true,
      valid: true,
      discountPercent: config.referredDiscountPercent,
      message: `Referral code applied! You get ${config.referredDiscountPercent}% off orders above ₹${config.minOrderValuePaise / 100}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Internal Hook: Called by orderController when payment is captured
exports.handleOrderPointsAndReferrals = async (order) => {
  try {
    const config = await getOrCreateConfig();
    if (!config.isActive) return;

    const totalPaise = order.totalAmountPaise || 0;
    const userId = order.userId;

    // 1. Award purchase loyalty points to the buyer
    if (userId) {
      const buyerAccount = await getOrCreateAccount(userId);
      const earnedPoints = Math.floor(totalPaise / 10000) * config.pointsPerHundredRupees;

      if (earnedPoints > 0) {
        buyerAccount.pointsBalance += earnedPoints;
        buyerAccount.lifetimePointsEarned += earnedPoints;
        buyerAccount.history.push({
          type: 'purchase',
          points: earnedPoints,
          orderId: order._id,
          note: `Earned from Order #${order.orderNumber}`
        });
        await buyerAccount.save();
      }
    }

    // 2. Process referral bonus if referral code was used
    if (order.appliedReferralCode) {
      const cleanCode = order.appliedReferralCode.toUpperCase().trim();
      const referrerAccount = await RewardAccount.findOne({ referralCode: cleanCode });

      if (referrerAccount) {
        // Prevent self-referral
        if (!userId || referrerAccount.userId.toString() !== userId.toString()) {
          // Check if this was referrer's qualified reward
          const bonus = config.referrerBonusPoints;
          referrerAccount.pointsBalance += bonus;
          referrerAccount.lifetimePointsEarned += bonus;
          referrerAccount.history.push({
            type: 'referral_bonus',
            points: bonus,
            orderId: order._id,
            note: `Referral bonus from friend's order #${order.orderNumber}`
          });

          referrerAccount.referrals.push({
            referredUser: userId || referrerAccount.userId,
            status: 'rewarded',
            orderId: order._id,
            bonusAwarded: bonus,
            date: new Date()
          });

          await referrerAccount.save();
        }
      }
    }
  } catch (err) {
    console.error('Error awarding loyalty/referral points:', err.message);
  }
};

// ADMIN: GET /api/rewards/admin/all
exports.getAdminRewardsOverview = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const topAccounts = await RewardAccount.find()
      .populate('userId', 'name email')
      .sort({ lifetimePointsEarned: -1 })
      .limit(50);

    const totalPointsCirculating = await RewardAccount.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$pointsBalance' } } }
    ]);

    res.json({
      success: true,
      config,
      totalPointsCirculating: totalPointsCirculating[0]?.totalBalance || 0,
      topAccounts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: POST /api/rewards/admin/config
exports.updateAdminConfig = async (req, res) => {
  try {
    const updates = req.body;
    let config = await getOrCreateConfig();

    if (updates.isActive !== undefined) config.isActive = updates.isActive;
    if (updates.pointsPerHundredRupees) config.pointsPerHundredRupees = Number(updates.pointsPerHundredRupees);
    if (updates.referrerBonusPoints) config.referrerBonusPoints = Number(updates.referrerBonusPoints);
    if (updates.referredDiscountPercent) config.referredDiscountPercent = Number(updates.referredDiscountPercent);
    if (updates.minOrderValuePaise) config.minOrderValuePaise = Number(updates.minOrderValuePaise);
    if (updates.maxRedemptionDiscountPercent) config.maxRedemptionDiscountPercent = Number(updates.maxRedemptionDiscountPercent);

    await config.save();

    res.json({
      success: true,
      message: 'Rewards configuration updated successfully.',
      config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: POST /api/rewards/admin/reverse-points
exports.adminReversePoints = async (req, res) => {
  try {
    const { userId, pointsToReverse, reason } = req.body;
    if (!userId || !pointsToReverse) {
      return res.status(400).json({ success: false, message: 'User ID and points count are required.' });
    }

    const account = await RewardAccount.findOne({ userId });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Reward account not found.' });
    }

    const numPoints = Math.min(account.pointsBalance, Number(pointsToReverse));
    account.pointsBalance -= numPoints;
    account.history.push({
      type: 'reversal',
      points: -numPoints,
      note: `Admin reversal: ${reason || 'Order cancellation / refund adjustment'}`
    });

    await account.save();

    res.json({
      success: true,
      message: `Reversed ${numPoints} points.`,
      newBalance: account.pointsBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
