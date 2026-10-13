const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Review = require('../models/Review');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      q,
      category,
      customizable,
      featured,
      minPrice,
      maxPrice,
      size,
      color,
      colour,
      inStock,
      availability,
      minRating,
      sortBy,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const filter = { isActive: true, status: 'published' };

    // Search query across name, description, tags, category, and fabric specs
    const searchQuery = (search || q || '').trim();
    if (searchQuery) {
      const escaped = escapeRegex(searchQuery);
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: { $in: [searchRegex] } },
        { category: searchRegex },
        { 'fabric.fit': searchRegex },
        { 'fabric.material': searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      const categories = category.split(',').map(c => c.trim()).filter(Boolean);
      if (categories.length === 1) {
        filter.category = categories[0];
      } else if (categories.length > 1) {
        filter.category = { $in: categories };
      }
    }

    // Boolean flags
    if (customizable !== undefined) {
      filter.isCustomizable = customizable === 'true';
    }
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    // Price range filters (accepts rupees or paise; standardizes to integer paise)
    const priceFilter = {};
    if (minPrice !== undefined && minPrice !== '') {
      const parsedMin = Number(minPrice);
      if (!isNaN(parsedMin) && parsedMin >= 0) {
        // If passed as rupees (< 10000), convert to paise
        priceFilter.$gte = parsedMin < 10000 ? Math.round(parsedMin * 100) : Math.round(parsedMin);
      }
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const parsedMax = Number(maxPrice);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        priceFilter.$lte = parsedMax < 10000 ? Math.round(parsedMax * 100) : Math.round(parsedMax);
      }
    }
    if (Object.keys(priceFilter).length > 0) {
      filter.basePricePaise = priceFilter;
    }

    // Filter by variant attributes (size, colour, availability)
    const selectedColor = (color || colour || '').trim();
    const selectedSize = (size || '').trim();
    const requireInStock = inStock === 'true' || availability === 'in_stock';

    let variantFilterRequired = false;
    const variantQuery = { isActive: true };

    if (selectedSize && selectedSize !== 'all') {
      variantFilterRequired = true;
      variantQuery.size = selectedSize.toUpperCase();
    }
    if (selectedColor && selectedColor !== 'all') {
      variantFilterRequired = true;
      const colorRegex = new RegExp(`^${escapeRegex(selectedColor)}$`, 'i');
      variantQuery.$or = [
        { 'color.id': colorRegex },
        { 'color.name': colorRegex }
      ];
    }
    if (requireInStock) {
      variantFilterRequired = true;
      variantQuery.stockQuantity = { $gt: 0 };
    }

    if (variantFilterRequired) {
      const matchingProductIds = await ProductVariant.find(variantQuery).distinct('productId');
      if (requireInStock) {
        // Allow customizable blanks as well since they are made-to-order
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { _id: { $in: matchingProductIds } },
            { isCustomizable: true }
          ]
        });
      } else {
        filter._id = { $in: matchingProductIds };
      }
    }

    // Rating filter (via verified reviews)
    if (minRating !== undefined && minRating !== '') {
      const minRatingNum = parseFloat(minRating);
      if (!isNaN(minRatingNum) && minRatingNum > 0) {
        const ratingAgg = await Review.aggregate([
          { $match: { isHidden: false } },
          { $group: { _id: '$productId', avgRating: { $avg: '$rating' } } },
          { $match: { avgRating: { $gte: minRatingNum } } }
        ]);
        const ratedProductIds = ratingAgg.map(r => r._id);
        filter._id = filter._id
          ? { $in: ratedProductIds.filter(id => (filter._id.$in || []).some(existingId => existingId.toString() === id.toString())) }
          : { $in: ratedProductIds };
      }
    }

    // Sorting
    const sortKey = (sortBy || sort || 'featured').toLowerCase();
    let sortOptions = { createdAt: -1 };

    switch (sortKey) {
      case 'price_low':
      case 'price_asc':
      case 'price-low-high':
        sortOptions = { basePricePaise: 1 };
        break;
      case 'price_high':
      case 'price_desc':
      case 'price-high-low':
        sortOptions = { basePricePaise: -1 };
        break;
      case 'newest':
      case 'latest':
        sortOptions = { createdAt: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Efficient batch variant retrieval in a single query
    const productIds = products.map(p => p._id);
    const allVariants = await ProductVariant.find({
      productId: { $in: productIds },
      isActive: true
    });

    const variantMap = {};
    for (const v of allVariants) {
      const pidStr = v.productId.toString();
      if (!variantMap[pidStr]) {
        variantMap[pidStr] = [];
      }
      variantMap[pidStr].push(v);
    }

    const productsWithVariants = products.map((prod) => ({
      ...prod.toObject(),
      variants: variantMap[prod._id.toString()] || []
    }));

    res.json({
      success: true,
      count: productsWithVariants.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      products: productsWithVariants
    });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Could not retrieve catalogue products.'
        : err.message
    });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true, status: 'published' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const variants = await ProductVariant.find({ productId: product._id, isActive: true });
    res.json({ success: true, product: { ...product.toObject(), variants } });
  } catch (err) {
    console.error('getProductBySlug error:', err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Could not load product details.'
        : err.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findOne({ _id: req.params.id, isActive: true, status: 'published' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const variants = await ProductVariant.find({ productId: product._id, isActive: true });
    res.json({ success: true, product: { ...product.toObject(), variants } });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Could not load product details.'
        : err.message
    });
  }
};

const adminController = require('./adminController');
exports.updateProduct = adminController.updateProduct;
