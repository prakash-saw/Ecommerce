const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AdminAuditLog = require('../models/AdminAuditLog');

// Helper to sanitize text (strip HTML tags)
const sanitizeText = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

// Check if customer has verified purchase of this product
const checkVerifiedPurchase = async (userId, userEmail, productId) => {
  if (!userId && !userEmail) return { isVerified: false, orderId: null };

  const query = {
    $or: [
      { userId: userId },
      { 'customer.email': (userEmail || '').toLowerCase().trim() }
    ],
    $and: [
      {
        $or: [
          { 'payment.status': 'captured' },
          { status: { $in: ['processing', 'shipped', 'delivered', 'completed'] } }
        ]
      },
      { 'items.productId': productId }
    ]
  };

  const eligibleOrder = await Order.findOne(query).sort({ createdAt: -1 });
  if (eligibleOrder) {
    return { isVerified: true, orderId: eligibleOrder._id };
  }
  return { isVerified: false, orderId: null };
};

// GET /api/reviews/product/:productId
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, verifiedOnly, sortBy = 'newest', page = 1, limit = 20 } = req.query;

    const filter = {
      productId,
      isHidden: false
    };

    if (rating && !isNaN(rating)) {
      filter.rating = Number(rating);
    }

    if (verifiedOnly === 'true') {
      filter.isVerifiedPurchase = true;
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'highest') sort = { rating: -1, createdAt: -1 };
    if (sortBy === 'lowest') sort = { rating: 1, createdAt: -1 };

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const [reviews, totalCount, allActiveReviews] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-reports -moderationNotes'),
      Review.countDocuments(filter),
      Review.find({ productId, isHidden: false }).select('rating isVerifiedPurchase')
    ]);

    // Calculate rating distribution & average
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let verifiedCount = 0;

    allActiveReviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
      ratingSum += r.rating;
      if (r.isVerifiedPurchase) verifiedCount += 1;
    });

    const averageRating = allActiveReviews.length > 0
      ? Number((ratingSum / allActiveReviews.length).toFixed(1))
      : 0;

    // Check if current user is eligible to review or has already reviewed
    let userReviewStatus = { canReview: false, existingReviewId: null, isVerified: false };
    if (req.user) {
      const existing = await Review.findOne({ productId, userId: req.user._id });
      const purchaseCheck = await checkVerifiedPurchase(req.user._id, req.user.email, productId);
      userReviewStatus = {
        canReview: !existing,
        existingReviewId: existing ? existing._id : null,
        isVerified: purchaseCheck.isVerified
      };
    }

    res.json({
      success: true,
      averageRating,
      totalReviews: allActiveReviews.length,
      verifiedCount,
      distribution,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      },
      userReviewStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, photos } = req.body;
    const userId = req.user._id;

    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ success: false, message: 'Rating, title, and review comments are required.' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check for existing review by this user
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.'
      });
    }

    // Verify purchase strictly on the server
    const verification = await checkVerifiedPurchase(userId, req.user.email, productId);

    // Sanitize user inputs
    const cleanTitle = sanitizeText(title).slice(0, 120);
    const cleanComment = sanitizeText(comment).slice(0, 2000);

    // Validate photos array if provided
    let cleanPhotos = [];
    if (Array.isArray(photos)) {
      cleanPhotos = photos
        .filter(url => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/')))
        .slice(0, 4);
    }

    const review = new Review({
      userId,
      productId,
      customerName: req.user.name || 'Verified Customer',
      rating: numericRating,
      title: cleanTitle,
      comment: cleanComment,
      photos: cleanPhotos,
      isVerifiedPurchase: verification.isVerified,
      verifiedOrderId: verification.orderId
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: verification.isVerified
        ? 'Verified purchase review published successfully!'
        : 'Review submitted successfully!',
      review
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this product.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/reviews/:reviewId
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, photos } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Ensure ownership or admin
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only edit your own review.' });
    }

    if (rating) {
      const numericRating = Number(rating);
      if (numericRating >= 1 && numericRating <= 5) review.rating = numericRating;
    }
    if (title) review.title = sanitizeText(title).slice(0, 120);
    if (comment) review.comment = sanitizeText(comment).slice(0, 2000);
    if (Array.isArray(photos)) {
      review.photos = photos
        .filter(url => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/')))
        .slice(0, 4);
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully.',
      review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:reviewId
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews/:reviewId/report
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Report reason is required.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.reportCount += 1;
    review.reports.push({
      reason: sanitizeText(reason).slice(0, 250),
      reportedBy: req.user ? req.user.name : 'Guest Customer',
      reportedAt: new Date()
    });

    // Auto-flag for moderator if reportCount reaches 3
    if (review.reportCount >= 3) {
      review.isHidden = true;
      review.moderationNotes = 'Auto-hidden due to community reports.';
    }

    await review.save();

    res.json({
      success: true,
      message: 'Thank you. The review has been flagged for atelier moderation.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: GET /api/reviews/admin/all
exports.getAdminReviews = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status === 'reported') {
      filter.reportCount = { $gt: 0 };
    } else if (status === 'hidden') {
      filter.isHidden = true;
    }

    const reviews = await Review.find(filter)
      .populate('productId', 'name slug images')
      .populate('userId', 'name email')
      .sort({ reportCount: -1, createdAt: -1 })
      .limit(100);

    const stats = {
      totalReviews: await Review.countDocuments(),
      reportedReviews: await Review.countDocuments({ reportCount: { $gt: 0 } }),
      hiddenReviews: await Review.countDocuments({ isHidden: true })
    };

    res.json({
      success: true,
      stats,
      reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: POST /api/reviews/admin/:reviewId/toggle-visibility
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { moderationNotes } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.isHidden = !review.isHidden;
    if (moderationNotes) {
      review.moderationNotes = sanitizeText(moderationNotes);
    }
    await review.save();

    // Log in admin audit trail
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: review.isHidden ? 'hide_review' : 'restore_review',
      entity: 'Review',
      entityId: review._id.toString(),
      details: {
        productId: review.productId,
        isHidden: review.isHidden,
        notes: moderationNotes
      }
    });

    res.json({
      success: true,
      message: review.isHidden ? 'Review is now hidden from the store.' : 'Review restored and visible.',
      review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
