const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

const getOrCreateWishlist = async (req) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.headers['x-guest-session'] || 'guest_default_session';

  let wishlist = null;
  if (userId) {
    wishlist = await Wishlist.findOne({ userId });
  }
  if (!wishlist) {
    wishlist = await Wishlist.findOne({ sessionId });
  }
  if (!wishlist) {
    wishlist = new Wishlist({
      userId,
      sessionId,
      products: []
    });
    await wishlist.save();
  } else if (userId && !wishlist.userId) {
    wishlist.userId = userId;
    await wishlist.save();
  }
  return wishlist;
};

// Helper to attach product variants and stock to populated products
const populateWithVariants = async (products) => {
  const results = [];
  for (const prod of products) {
    if (!prod || !prod.isActive) continue;
    const variants = await ProductVariant.find({ productId: prod._id, isActive: true });
    const prodObj = prod.toObject ? prod.toObject() : prod;
    prodObj.variants = variants;
    results.push(prodObj);
  }
  return results;
};

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-guest-session'] || 'guest_default_session';

    let wishlist = null;
    if (userId) {
      wishlist = await Wishlist.findOne({ userId });
    }
    if (!wishlist) {
      wishlist = await Wishlist.findOne({ sessionId });
    }

    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return res.json({
        success: true,
        count: 0,
        products: []
      });
    }

    await wishlist.populate('products');

    const activeProducts = wishlist.products.filter(p => p && p.isActive);
    const enrichedProducts = await populateWithVariants(activeProducts);

    res.json({
      success: true,
      count: enrichedProducts.length,
      products: enrichedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const wishlist = await getOrCreateWishlist(req);
    const prodIdStr = productId.toString();
    const index = wishlist.products.findIndex(id => id.toString() === prodIdStr);

    let inWishlist = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      inWishlist = false;
    } else {
      wishlist.products.push(product._id);
      inWishlist = true;
    }

    await wishlist.save();
    await wishlist.populate('products');
    const activeProducts = wishlist.products.filter(p => p && p.isActive);
    const enrichedProducts = await populateWithVariants(activeProducts);

    res.json({
      success: true,
      inWishlist,
      message: inWishlist ? 'Saved to wishlist' : 'Removed from wishlist',
      count: enrichedProducts.length,
      products: enrichedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req);

    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    await wishlist.populate('products');
    const activeProducts = wishlist.products.filter(p => p && p.isActive);
    const enrichedProducts = await populateWithVariants(activeProducts);

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      count: enrichedProducts.length,
      products: enrichedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Merge guest wishlist into user wishlist upon login
exports.mergeWishlist = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required for merge.' });
    }

    const { guestProductIds } = req.body;
    const userId = req.user._id;
    let userWishlist = await Wishlist.findOne({ userId });

    if (!userWishlist) {
      userWishlist = new Wishlist({
        userId,
        sessionId: req.headers['x-guest-session'] || `user_${userId}`,
        products: []
      });
    }

    // Also check if there was a guest session wishlist in DB
    const guestSessionId = req.headers['x-guest-session'];
    let sessionWishlist = null;
    if (guestSessionId) {
      sessionWishlist = await Wishlist.findOne({ sessionId: guestSessionId, userId: null });
    }

    const productIdsToAdd = new Set();
    if (Array.isArray(guestProductIds)) {
      guestProductIds.forEach(id => productIdsToAdd.add(id.toString()));
    }
    if (sessionWishlist && sessionWishlist.products) {
      sessionWishlist.products.forEach(id => productIdsToAdd.add(id.toString()));
    }

    // Add unique IDs to user's wishlist
    const existingIds = new Set(userWishlist.products.map(id => id.toString()));
    for (const idStr of productIdsToAdd) {
      if (!existingIds.has(idStr)) {
        userWishlist.products.push(idStr);
      }
    }

    await userWishlist.save();

    // Clean up temporary session wishlist
    if (sessionWishlist) {
      await Wishlist.deleteOne({ _id: sessionWishlist._id });
    }

    await userWishlist.populate('products');
    const activeProducts = userWishlist.products.filter(p => p && p.isActive);
    const enrichedProducts = await populateWithVariants(activeProducts);

    res.json({
      success: true,
      message: 'Wishlist merged successfully.',
      count: enrichedProducts.length,
      products: enrichedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin stats: Most saved items across wishlists
exports.getWishlistStats = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$products' },
      { $group: { _id: '$products', totalSaves: { $sum: 1 } } },
      { $sort: { totalSaves: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          totalSaves: 1,
          name: '$product.name',
          slug: '$product.slug',
          basePricePaise: '$product.basePricePaise',
          images: '$product.images'
        }
      }
    ];

    const popularWishlistItems = await Wishlist.aggregate(pipeline);
    const totalWishlists = await Wishlist.countDocuments({ 'products.0': { $exists: true } });

    res.json({
      success: true,
      totalActiveWishlists: totalWishlists,
      popularItems: popularWishlistItems
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
