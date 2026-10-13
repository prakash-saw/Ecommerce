const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const InventoryMovement = require('../models/InventoryMovement');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');
const Collection = require('../models/Collection');
const StoreSettings = require('../models/StoreSettings');
const AdminAuditLog = require('../models/AdminAuditLog');
const emailService = require('../services/emailService');

// Helper to log admin actions
async function recordAudit(adminEmail, action, resourceType, resourceId, details = {}) {
  try {
    await AdminAuditLog.create({
      adminEmail: adminEmail || 'admin@blancatelier.com',
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : undefined,
      details,
      timestamp: new Date()
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }
}

// -------------------------------------------------------------
// 1. OVERVIEW & ANALYTICS
// -------------------------------------------------------------
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. Settings for low stock threshold
    const settings = await StoreSettings.findOne() || { lowStockThreshold: 10 };
    const lowStockThreshold = settings.lowStockThreshold || 10;

    // 2. All paid non-cancelled orders for net revenue metrics
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'PAID' },
            { 'payment.status': 'captured' }
          ],
          orderStatus: { $nin: ['CANCELLED', 'EXPIRED'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenuePaise: { $sum: '$pricing.totalAmountPaise' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const totalRevenuePaise = revenueAgg[0]?.totalRevenuePaise || 0;
    const totalCapturedOrders = revenueAgg[0]?.totalOrders || 0;
    const averageOrderValuePaise = totalCapturedOrders > 0
      ? Math.round(totalRevenuePaise / totalCapturedOrders)
      : 0;

    // 2b. Uncollected COD orders awaiting delivery/cash collection
    const codUncollectedAgg = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          orderStatus: { $nin: ['CANCELLED', 'EXPIRED'] }
        }
      },
      {
        $group: {
          _id: null,
          totalUncollectedPaise: { $sum: '$pricing.totalAmountPaise' },
          orderCount: { $sum: 1 }
        }
      }
    ]);
    const codUncollectedPaise = codUncollectedAgg[0]?.totalUncollectedPaise || 0;
    const codUncollectedOrders = codUncollectedAgg[0]?.orderCount || 0;

    // 3. Pending orders count (awaiting fulfilment)
    const pendingOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['CONFIRMED', 'PROCESSING'] },
      fulfilmentStatus: { $in: ['pending_approval', 'approved', 'in_production', 'packed', 'processing'] }
    });

    const totalOrdersCount = await Order.countDocuments();

    // 4. Sales trends over the selected period (daily breakdown)
    const salesTrends = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'PAID' },
            { 'payment.status': 'captured' }
          ],
          orderStatus: { $nin: ['CANCELLED', 'EXPIRED'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenuePaise: { $sum: '$pricing.totalAmountPaise' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days so chart is continuous
    const trendMap = new Map();
    salesTrends.forEach(item => trendMap.set(item._id, item));

    const filledTrends = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey);
      filledTrends.push({
        date: dateKey,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenuePaise: existing ? existing.revenuePaise : 0,
        ordersCount: existing ? existing.ordersCount : 0
      });
    }

    // 5. Best selling products (by quantity and revenue)
    const bestSellers = await Order.aggregate([
      {
        $match: {
          'payment.status': 'captured',
          fulfilmentStatus: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          productSlug: { $first: '$items.productSlug' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenuePaise: { $sum: '$items.lineTotalPaise' }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 }
    ]);

    // 6. Low stock & out of stock variants
    const lowStockVariants = await ProductVariant.find({
      stockQuantity: { $lte: lowStockThreshold },
      isActive: true
    })
      .populate('productId', 'name slug images')
      .sort({ stockQuantity: 1 })
      .limit(10);

    const outOfStockCount = await ProductVariant.countDocuments({
      stockQuantity: 0,
      isActive: true
    });

    const lowStockCount = await ProductVariant.countDocuments({
      stockQuantity: { $gt: 0, $lte: lowStockThreshold },
      isActive: true
    });

    // 7. Recent orders feed
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('orderNumber customer pricing.totalAmountPaise payment.status fulfilmentStatus createdAt items');

    // 8. Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$fulfilmentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        totalRevenuePaise,
        totalOrdersCount,
        totalCapturedOrders,
        pendingOrdersCount,
        averageOrderValuePaise,
        codUncollected: {
          totalPaise: codUncollectedPaise,
          orderCount: codUncollectedOrders
        },
        salesTrends: filledTrends,
        bestSellers,
        inventoryAlerts: {
          lowStockThreshold,
          lowStockCount,
          outOfStockCount,
          items: lowStockVariants.map(v => ({
            variantId: v._id,
            sku: v.sku,
            productName: v.productId?.name || 'T-Shirt',
            productSlug: v.productId?.slug || '',
            size: v.size,
            colorName: v.color?.name || '',
            stockQuantity: v.stockQuantity,
            status: v.stockQuantity === 0 ? 'out_of_stock' : 'low_stock'
          }))
        },
        recentOrders,
        statusDistribution: statusDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 2. PRODUCT MANAGEMENT
// -------------------------------------------------------------
exports.getAdminProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      productType,
      status,
      stockStatus,
      sortBy = 'newest',
      page = 1,
      limit = 15
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (productType) query.productType = productType;
    if (status) query.status = status;

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { slug: regex }, { tags: regex }];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'price_asc') sort = { basePricePaise: 1 };
    if (sortBy === 'price_desc') sort = { basePricePaise: -1 };
    if (sortBy === 'name') sort = { name: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach variant inventory stats to each product
    const productIds = products.map(p => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();

    const enrichedProducts = products.map(prod => {
      const prodVariants = variants.filter(v => String(v.productId) === String(prod._id));
      const totalStock = prodVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      const isOutOfStock = prodVariants.length > 0 && prodVariants.every(v => v.stockQuantity === 0);
      const isLowStock = prodVariants.some(v => v.stockQuantity > 0 && v.stockQuantity <= 10);

      return {
        ...prod,
        variantCount: prodVariants.length,
        totalStock,
        stockStatus: isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : 'in_stock',
        variants: prodVariants
      };
    });

    // Optional post-filter by stock status if requested
    let finalProducts = enrichedProducts;
    if (stockStatus) {
      finalProducts = enrichedProducts.filter(p => p.stockStatus === stockStatus);
    }

    res.json({
      success: true,
      products: finalProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ productId: product._id });

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        variants
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      basePricePaise,
      compareAtPricePaise,
      costPricePaise,
      category = 'ready_to_wear',
      tags = [],
      productType = 'ready_to_wear',
      status = 'published',
      featured = false,
      isCustomizable = false,
      fabric,
      images = [],
      sizeChart = [],
      seoTitle,
      seoDescription,
      variants = []
    } = req.body;

    if (!name || !basePricePaise || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and base price are required'
      });
    }

    // Generate slug if not provided
    const computedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure slug uniqueness
    const existingSlug = await Product.findOne({ slug: computedSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: `A product with slug "${computedSlug}" already exists. Please provide a unique slug.`
      });
    }

    const product = new Product({
      name: name.trim(),
      slug: computedSlug,
      description,
      shortDescription,
      basePricePaise: parseInt(basePricePaise, 10),
      compareAtPricePaise: compareAtPricePaise ? parseInt(compareAtPricePaise, 10) : null,
      costPricePaise: costPricePaise ? parseInt(costPricePaise, 10) : null,
      category,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [],
      productType,
      status,
      featured: Boolean(featured),
      isCustomizable: Boolean(isCustomizable),
      fabric: fabric || {
        gsm: 240,
        material: '100% Combed Organic Cotton',
        fit: 'Relaxed Boxy / Drop Shoulder',
        finish: 'Bio-Washed Pre-Shrunk Single Jersey'
      },
      images: images.length > 0 ? images : [{
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
        alt: name,
        isPrimary: true,
        view: 'front'
      }],
      sizeChart: sizeChart.length > 0 ? sizeChart : [
        { size: 'S', chestCm: 102, lengthCm: 71, shoulderCm: 48, sleeveCm: 22 },
        { size: 'M', chestCm: 107, lengthCm: 74, shoulderCm: 50, sleeveCm: 23 },
        { size: 'L', chestCm: 112, lengthCm: 76, shoulderCm: 52, sleeveCm: 24 },
        { size: 'XL', chestCm: 117, lengthCm: 79, shoulderCm: 54, sleeveCm: 25 },
        { size: 'XXL', chestCm: 122, lengthCm: 81, shoulderCm: 56, sleeveCm: 26 }
      ],
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || shortDescription || description.slice(0, 160)
    });

    await product.save();

    // Create variants if supplied, or create standard S-XXL variants
    const createdVariants = [];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

    if (variants && variants.length > 0) {
      for (const v of variants) {
        const sku = (v.sku || `${computedSlug.toUpperCase().slice(0, 8)}-${v.size}-${v.color?.name || 'WHT'}`).replace(/[^A-Z0-9-]/g, '');
        const newVariant = new ProductVariant({
          productId: product._id,
          sku,
          size: v.size || 'M',
          color: v.color || { id: 'blanc-white', name: 'Blanc White', hex: '#FDFBF7' },
          stockQuantity: parseInt(v.stockQuantity, 10) || 20,
          priceOverridePaise: v.priceOverridePaise || null
        });
        await newVariant.save();
        createdVariants.push(newVariant);

        // Record initial inventory movement
        await InventoryMovement.create({
          variantId: newVariant._id,
          productId: product._id,
          sku: newVariant.sku,
          previousQuantity: 0,
          newQuantity: newVariant.stockQuantity,
          changeQuantity: newVariant.stockQuantity,
          reason: 'restock',
          notes: 'Initial stock intake',
          adminEmail: req.user?.email || 'admin@blancatelier.com'
        });
      }
    } else {
      // Default variants in Blanc White
      for (const size of sizes) {
        const sku = `BLC-${computedSlug.toUpperCase().slice(0, 6)}-${size}`;
        const newVariant = new ProductVariant({
          productId: product._id,
          sku,
          size,
          color: { id: 'blanc-white', name: 'Blanc White', hex: '#FDFBF7' },
          stockQuantity: 25
        });
        await newVariant.save();
        createdVariants.push(newVariant);

        await InventoryMovement.create({
          variantId: newVariant._id,
          productId: product._id,
          sku: newVariant.sku,
          previousQuantity: 0,
          newQuantity: 25,
          changeQuantity: 25,
          reason: 'restock',
          notes: 'Initial stock intake',
          adminEmail: req.user?.email || 'admin@blancatelier.com'
        });
      }
    }

    await recordAudit(req.user?.email, 'PRODUCT_CREATED', 'Product', product._id, {
      name: product.name,
      basePricePaise: product.basePricePaise
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        ...product.toObject(),
        variants: createdVariants
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product core fields
    if (updates.name) product.name = updates.name.trim();
    if (updates.slug) product.slug = updates.slug.toLowerCase().trim();
    if (updates.description) product.description = updates.description;
    if (updates.shortDescription !== undefined) product.shortDescription = updates.shortDescription;
    if (updates.basePricePaise !== undefined) product.basePricePaise = parseInt(updates.basePricePaise, 10);
    if (updates.compareAtPricePaise !== undefined) product.compareAtPricePaise = updates.compareAtPricePaise ? parseInt(updates.compareAtPricePaise, 10) : null;
    if (updates.costPricePaise !== undefined) product.costPricePaise = updates.costPricePaise ? parseInt(updates.costPricePaise, 10) : null;
    if (updates.category) product.category = updates.category;
    if (updates.tags) product.tags = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim());
    if (updates.productType) product.productType = updates.productType;
    if (updates.status) product.status = updates.status;
    if (updates.featured !== undefined) product.featured = Boolean(updates.featured);
    if (updates.fabric) product.fabric = { ...product.fabric, ...updates.fabric };
    if (updates.images && Array.isArray(updates.images)) product.images = updates.images;
    if (updates.sizeChart && Array.isArray(updates.sizeChart)) product.sizeChart = updates.sizeChart;
    if (updates.seoTitle !== undefined) product.seoTitle = updates.seoTitle;
    if (updates.seoDescription !== undefined) product.seoDescription = updates.seoDescription;

    await product.save();

    // Update variants if provided
    if (updates.variants && Array.isArray(updates.variants)) {
      for (const v of updates.variants) {
        if (v._id) {
          const existingVariant = await ProductVariant.findById(v._id);
          if (existingVariant) {
            const oldStock = existingVariant.stockQuantity;
            const newStock = parseInt(v.stockQuantity, 10);

            existingVariant.size = v.size || existingVariant.size;
            if (v.sku) existingVariant.sku = v.sku.toUpperCase();
            if (v.color) existingVariant.color = v.color;
            if (!isNaN(newStock) && newStock !== oldStock) {
              existingVariant.stockQuantity = newStock;
              await InventoryMovement.create({
                variantId: existingVariant._id,
                productId: product._id,
                sku: existingVariant.sku,
                previousQuantity: oldStock,
                newQuantity: newStock,
                changeQuantity: newStock - oldStock,
                reason: 'manual_adjustment',
                notes: 'Admin variant stock adjustment',
                adminEmail: req.user?.email || 'admin@blancatelier.com'
              });
            }
            await existingVariant.save();
          }
        } else if (v.size) {
          // New variant added to existing product
          const newVar = new ProductVariant({
            productId: product._id,
            sku: v.sku || `${product.slug.toUpperCase().slice(0, 8)}-${v.size}-${Date.now().toString().slice(-4)}`,
            size: v.size,
            color: v.color || { id: 'blanc-white', name: 'Blanc White', hex: '#FDFBF7' },
            stockQuantity: parseInt(v.stockQuantity, 10) || 0
          });
          await newVar.save();
        }
      }
    }

    await recordAudit(req.user?.email, 'PRODUCT_UPDATED', 'Product', product._id, {
      name: product.name,
      status: product.status
    });

    const refreshedVariants = await ProductVariant.find({ productId: product._id });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        ...product.toObject(),
        variants: refreshedVariants
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft-archive so historical orders and reviews are preserved
    product.status = 'archived';
    product.isActive = false;
    await product.save();

    await recordAudit(req.user?.email, 'PRODUCT_ARCHIVED', 'Product', product._id, {
      name: product.name
    });

    res.json({
      success: true,
      message: `Product "${product.name}" has been archived.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }

    let update = {};
    if (action === 'publish') update = { status: 'published', isActive: true };
    else if (action === 'archive') update = { status: 'archived', isActive: false };
    else if (action === 'draft') update = { status: 'draft', isActive: true };
    else {
      return res.status(400).json({ success: false, message: 'Invalid action. Choose publish, archive, or draft' });
    }

    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: update });

    await recordAudit(req.user?.email, 'PRODUCTS_BULK_UPDATE', 'Product', null, {
      count: result.modifiedCount,
      action
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} products to ${action}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 3. ORDER MANAGEMENT
// -------------------------------------------------------------
exports.getAdminOrders = async (req, res) => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      fulfilmentStatus,
      startDate,
      endDate,
      sortBy = 'newest',
      page = 1,
      limit = 15
    } = req.query;

    const query = {};

    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentStatus) {
      query.$or = [
        { paymentStatus: paymentStatus },
        { 'payment.status': paymentStatus.toLowerCase() }
      ];
    }
    if (fulfilmentStatus) query.fulfilmentStatus = fulfilmentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex }
      ];
    }

    const sort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('orderNumber customer pricing payment orderStatus paymentStatus paymentMethod fulfilmentStatus tracking createdAt items');

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, fulfilmentStatus, carrier, trackingNumber, trackingUrl, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Protection rule: admin cannot manually mark an unverified prepaid order as PAID
    if (paymentStatus === 'PAID' && order.paymentMethod === 'PREPAID' && order.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Prepaid orders cannot be manually marked as PAID. Payment verification requires verified gateway transaction.'
      });
    }

    const oldStatus = order.orderStatus || order.fulfilmentStatus;

    if (fulfilmentStatus) {
      order.fulfilmentStatus = fulfilmentStatus;
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (carrier !== undefined) order.tracking.carrier = carrier;
    if (trackingNumber !== undefined) order.tracking.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) order.tracking.trackingUrl = trackingUrl;

    // Transition to SHIPPED
    if (fulfilmentStatus === 'shipped' || orderStatus === 'SHIPPED') {
      order.orderStatus = 'SHIPPED';
      order.fulfilmentStatus = 'shipped';
      if (!order.tracking.shippedAt) {
        order.tracking.shippedAt = new Date();
      }
      try {
        await emailService.sendOrderShipped({ order });
      } catch (e) {
        console.warn('Shipment email non-fatal warning:', e.message);
      }
    }

    // Transition to DELIVERED
    if (fulfilmentStatus === 'delivered' || orderStatus === 'DELIVERED') {
      order.orderStatus = 'DELIVERED';
      order.fulfilmentStatus = 'delivered';
      // If COD order, cash is collected upon delivery!
      if (order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID') {
        order.paymentStatus = 'PAID';
        order.payment.status = 'captured';
        order.payment.paidAt = new Date();
      }
      try {
        await emailService.sendOrderDelivered({ order });
      } catch (e) {
        console.warn('Delivery email non-fatal warning:', e.message);
      }
    }

    // Transition to PROCESSING
    if (fulfilmentStatus === 'in_production' || fulfilmentStatus === 'packed' || orderStatus === 'PROCESSING') {
      order.orderStatus = 'PROCESSING';
    }

    // Append to order audit log
    order.auditLog.push({
      actor: req.user?.email || 'Admin',
      action: `Status updated from "${oldStatus}" to "${order.orderStatus} (${order.fulfilmentStatus})"`,
      note: note || (trackingNumber ? `AWB: ${trackingNumber} (${carrier || 'Courier'})` : ''),
      timestamp: new Date()
    });

    await order.save();

    await recordAudit(req.user?.email, 'ORDER_STATUS_UPDATED', 'Order', order._id, {
      orderNumber: order.orderNumber,
      from: oldStatus,
      to: order.orderStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.auditLog.push({
      actor: req.user?.email || 'Admin',
      action: 'Internal Note',
      note: note.trim(),
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      auditLog: order.auditLog
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by administrator', restoreStock = true } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'CANCELLED' || order.fulfilmentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (order.orderStatus === 'DELIVERED' || order.fulfilmentStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled directly. Please initiate a return request instead.'
      });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = 'CANCELLED';
    order.fulfilmentStatus = 'cancelled';
    order.rejectionReason = reason;

    // Restore inventory atomically if requested
    if (restoreStock && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (!item.isCustom) {
          const variant = await ProductVariant.findOne({
            productId: item.productId,
            size: item.selectedSize
          });

          if (variant) {
            const prev = variant.stockQuantity;
            const updated = await ProductVariant.findByIdAndUpdate(
              variant._id,
              { $inc: { stockQuantity: item.quantity } },
              { new: true }
            );

            await InventoryMovement.create({
              variantId: variant._id,
              productId: item.productId,
              sku: variant.sku,
              previousQuantity: prev,
              newQuantity: updated.stockQuantity,
              changeQuantity: item.quantity,
              reason: 'order_cancellation',
              notes: `Order cancellation restock (#${order.orderNumber})`,
              orderId: order._id,
              adminEmail: req.user?.email || 'admin@blancatelier.com'
            });
          }
        }
      }
    }

    // Note refund handling
    let refundNote = 'No payment captured, no refund required.';
    if (order.paymentStatus === 'PAID' || order.payment?.status === 'captured') {
      order.paymentStatus = 'REFUND_PENDING';
      order.payment.status = 'refunded';
      refundNote = 'Order queued for refund per store cancellation policy.';
    }

    order.auditLog.push({
      actor: req.user?.email || 'Admin',
      action: 'Order Cancelled',
      note: `${reason}. ${restoreStock ? 'Stock restored.' : 'Stock not restored.'} ${refundNote}`,
      timestamp: new Date()
    });

    await order.save();

    // Send cancellation email notification
    try {
      await emailService.sendOrderCancelled({ order, reason });
    } catch (e) {
      console.warn('Cancel email non-fatal warning:', e.message);
    }

    await recordAudit(req.user?.email, 'ORDER_CANCELLED', 'Order', order._id, {
      orderNumber: order.orderNumber,
      from: oldStatus,
      reason,
      restoreStock
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 4. INVENTORY MANAGEMENT
// -------------------------------------------------------------
exports.getAdminInventory = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const settings = await StoreSettings.findOne() || { lowStockThreshold: 10 };
    const lowStockThreshold = settings.lowStockThreshold || 10;

    let query = { isActive: true };

    if (status === 'out_of_stock') {
      query.stockQuantity = 0;
    } else if (status === 'low_stock') {
      query.stockQuantity = { $gt: 0, $lte: lowStockThreshold };
    } else if (status === 'in_stock') {
      query.stockQuantity = { $gt: lowStockThreshold };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.sku = regex;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const totalVariants = await ProductVariant.countDocuments(query);
    const variants = await ProductVariant.find(query)
      .populate('productId', 'name slug basePricePaise category images')
      .sort({ stockQuantity: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const formatted = variants.map(v => {
      const stock = v.stockQuantity;
      let stockStatus = 'in_stock';
      if (stock === 0) stockStatus = 'out_of_stock';
      else if (stock <= lowStockThreshold) stockStatus = 'low_stock';

      return {
        variantId: v._id,
        sku: v.sku,
        productId: v.productId?._id,
        productName: v.productId?.name || 'T-Shirt',
        productSlug: v.productId?.slug || '',
        thumbnail: v.productId?.images?.[0]?.url || '',
        size: v.size,
        color: v.color,
        stockQuantity: stock,
        stockStatus,
        pricePaise: v.priceOverridePaise || v.productId?.basePricePaise || 79900
      };
    });

    res.json({
      success: true,
      lowStockThreshold,
      inventory: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalVariants,
        totalPages: Math.ceil(totalVariants / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adjustInventory = async (req, res) => {
  try {
    const { variantId, changeQuantity, reason, notes } = req.body;

    if (!variantId || changeQuantity === undefined) {
      return res.status(400).json({ success: false, message: 'variantId and changeQuantity are required' });
    }

    const delta = parseInt(changeQuantity, 10);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'changeQuantity must be a non-zero integer' });
    }

    const variant = await ProductVariant.findById(variantId).populate('productId', 'name');
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const prevQty = variant.stockQuantity;
    const newQty = prevQty + delta;

    if (newQty < 0) {
      return res.status(400).json({
        success: false,
        message: `Adjustment rejected: Cannot reduce stock below 0 (Current: ${prevQty}, Requested change: ${delta})`
      });
    }

    // Atomic update
    const updated = await ProductVariant.findByIdAndUpdate(
      variantId,
      { $inc: { stockQuantity: delta } },
      { new: true }
    );

    const validReason = ['purchase', 'restock', 'physical_audit', 'damage', 'order_cancellation', 'order_return', 'manual_adjustment'].includes(reason)
      ? reason
      : 'manual_adjustment';

    // Record movement history
    const movement = await InventoryMovement.create({
      variantId: variant._id,
      productId: variant.productId?._id,
      sku: variant.sku,
      previousQuantity: prevQty,
      newQuantity: updated.stockQuantity,
      changeQuantity: delta,
      reason: validReason,
      adminEmail: req.user?.email || 'admin@blancatelier.com',
      notes: notes || reason || ''
    });

    await recordAudit(req.user?.email, 'INVENTORY_ADJUSTED', 'ProductVariant', variant._id, {
      sku: variant.sku,
      previousQuantity: prevQty,
      newQuantity: updated.stockQuantity,
      delta,
      reason
    });

    res.json({
      success: true,
      message: `Stock for SKU ${variant.sku} adjusted by ${delta > 0 ? '+' + delta : delta} units.`,
      variant: updated,
      movement
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventoryMovements = async (req, res) => {
  try {
    const { variantId, sku, page = 1, limit = 20 } = req.query;
    const query = {};

    if (variantId) query.variantId = variantId;
    if (sku) query.sku = new RegExp(sku.trim(), 'i');

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await InventoryMovement.countDocuments(query);
    const movements = await InventoryMovement.find(query)
      .populate('productId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      movements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 5. COUPONS & OFFERS
// -------------------------------------------------------------
exports.getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      coupons
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType = 'percentage',
      discountValue,
      minOrderValuePaise = 0,
      maxDiscountPaise = null,
      startDate,
      expiryDate,
      usageLimit = null,
      perCustomerLimit = 1,
      firstOrderOnly = false,
      status = 'active'
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
    }

    const codeUpper = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeUpper });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${codeUpper}" already exists` });
    }

    const coupon = new Coupon({
      code: codeUpper,
      discountType,
      discountValue: parseInt(discountValue, 10),
      minOrderValuePaise: parseInt(minOrderValuePaise, 10) || 0,
      maxDiscountPaise: maxDiscountPaise ? parseInt(maxDiscountPaise, 10) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      perCustomerLimit: parseInt(perCustomerLimit, 10) || 1,
      firstOrderOnly: Boolean(firstOrderOnly),
      status
    });

    await coupon.save();

    await recordAudit(req.user?.email, 'COUPON_CREATED', 'Coupon', coupon._id, {
      code: coupon.code,
      discountType,
      discountValue
    });

    res.status(201).json({
      success: true,
      message: `Coupon ${coupon.code} created successfully`,
      coupon
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (updates.code) coupon.code = updates.code.trim().toUpperCase();
    if (updates.discountType) coupon.discountType = updates.discountType;
    if (updates.discountValue !== undefined) coupon.discountValue = parseInt(updates.discountValue, 10);
    if (updates.minOrderValuePaise !== undefined) coupon.minOrderValuePaise = parseInt(updates.minOrderValuePaise, 10);
    if (updates.maxDiscountPaise !== undefined) coupon.maxDiscountPaise = updates.maxDiscountPaise ? parseInt(updates.maxDiscountPaise, 10) : null;
    if (updates.startDate) coupon.startDate = new Date(updates.startDate);
    if (updates.expiryDate !== undefined) coupon.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : null;
    if (updates.usageLimit !== undefined) coupon.usageLimit = updates.usageLimit ? parseInt(updates.usageLimit, 10) : null;
    if (updates.perCustomerLimit !== undefined) coupon.perCustomerLimit = parseInt(updates.perCustomerLimit, 10);
    if (updates.firstOrderOnly !== undefined) coupon.firstOrderOnly = Boolean(updates.firstOrderOnly);
    if (updates.status) coupon.status = updates.status;

    await coupon.save();

    await recordAudit(req.user?.email, 'COUPON_UPDATED', 'Coupon', coupon._id, {
      code: coupon.code,
      status: coupon.status
    });

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Set to disabled to preserve historical order tracking
    coupon.status = 'disabled';
    await coupon.save();

    await recordAudit(req.user?.email, 'COUPON_DISABLED', 'Coupon', coupon._id, {
      code: coupon.code
    });

    res.json({
      success: true,
      message: `Coupon ${coupon.code} disabled.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 6. REVIEWS & SUPPORT
// -------------------------------------------------------------
exports.getAdminReviews = async (req, res) => {
  try {
    const { status, rating, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.moderationStatus = status;
    if (rating) query.rating = parseInt(rating, 10);

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('productId', 'name slug images')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'hidden', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Choose approved, hidden, or flagged' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.moderationStatus = status;
    review.moderatedBy = req.user?.email || 'admin@blancatelier.com';
    review.moderationReason = reason || '';
    await review.save();

    await recordAudit(req.user?.email, 'REVIEW_MODERATED', 'Review', review._id, {
      productId: review.productId,
      status,
      reason
    });

    res.json({
      success: true,
      message: `Review marked as "${status}".`,
      review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedAdminEmail } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedAdminEmail !== undefined) ticket.assignedAdminEmail = assignedAdminEmail;

    await ticket.save();

    await recordAudit(req.user?.email, 'SUPPORT_TICKET_UPDATED', 'SupportTicket', ticket._id, {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSupportTicketNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.internalNotes.push({
      authorEmail: req.user?.email || 'admin@blancatelier.com',
      text: note.trim(),
      createdAt: new Date()
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Note added to inquiry',
      internalNotes: ticket.internalNotes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Public support ticket creation
exports.createPublicSupportTicket = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderNumber,
      category = 'general',
      subject,
      message
    } = req.body;

    if (!customerName || !customerEmail || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    const ticketCount = await SupportTicket.countDocuments();
    const ticketNumber = `SUP-${String(ticketCount + 101).padStart(5, '0')}`;

    const ticket = new SupportTicket({
      ticketNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone ? customerPhone.trim() : '',
      orderNumber: orderNumber ? orderNumber.trim() : '',
      category,
      subject: subject ? subject.trim() : `Inquiry from ${customerName}`,
      message: message.trim()
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support request received. BLANC ATELIER concierge will respond within 24 hours.',
      ticketNumber: ticket.ticketNumber
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 7. COLLECTIONS & DROPS
// -------------------------------------------------------------
exports.getAdminCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('products', 'name slug basePricePaise images')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      collections
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      bannerImage,
      featuredOnHome = false,
      sortOrder = 0,
      products = [],
      status = 'published'
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }

    const computedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await Collection.findOne({ slug: computedSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: `Collection slug "${computedSlug}" already exists` });
    }

    const collection = new Collection({
      name: name.trim(),
      slug: computedSlug,
      description: description || '',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1200&q=80',
      featuredOnHome: Boolean(featuredOnHome),
      sortOrder: parseInt(sortOrder, 10) || 0,
      products,
      status
    });

    await collection.save();

    await recordAudit(req.user?.email, 'COLLECTION_CREATED', 'Collection', collection._id, {
      name: collection.name
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    if (updates.name) collection.name = updates.name.trim();
    if (updates.slug) collection.slug = updates.slug.toLowerCase().trim();
    if (updates.description !== undefined) collection.description = updates.description;
    if (updates.bannerImage !== undefined) collection.bannerImage = updates.bannerImage;
    if (updates.featuredOnHome !== undefined) collection.featuredOnHome = Boolean(updates.featuredOnHome);
    if (updates.sortOrder !== undefined) collection.sortOrder = parseInt(updates.sortOrder, 10);
    if (updates.products && Array.isArray(updates.products)) collection.products = updates.products;
    if (updates.status) collection.status = updates.status;

    await collection.save();

    await recordAudit(req.user?.email, 'COLLECTION_UPDATED', 'Collection', collection._id, {
      name: collection.name
    });

    res.json({
      success: true,
      message: 'Collection updated successfully',
      collection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    collection.status = 'archived';
    await collection.save();

    await recordAudit(req.user?.email, 'COLLECTION_ARCHIVED', 'Collection', collection._id, {
      name: collection.name
    });

    res.json({
      success: true,
      message: `Collection "${collection.name}" archived.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Public collections endpoints
exports.getPublicCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ status: 'published' })
      .populate({
        path: 'products',
        match: { status: 'published', isActive: true },
        select: 'name slug basePricePaise images category'
      })
      .sort({ sortOrder: 1 });

    res.json({
      success: true,
      collections
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPublicCollectionBySlug = async (req, res) => {
  try {
    const collection = await Collection.findOne({
      slug: req.params.slug,
      status: 'published'
    }).populate({
      path: 'products',
      match: { status: 'published', isActive: true },
      select: 'name slug basePricePaise compareAtPricePaise images category fabric'
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    res.json({
      success: true,
      collection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------------------------------------------------
// 8. STORE SETTINGS
// -------------------------------------------------------------
exports.getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        storeName: 'BLANC ATELIER',
        tagline: 'Architectural Minimalist Streetwear & Studio POD',
        contactEmail: 'concierge@blancatelier.com',
        whatsappNumber: '+91 98765 43210',
        currency: 'INR',
        lowStockThreshold: 10,
        freeShippingThresholdPaise: 99900,
        announcementText: 'Complimentary standard shipping on all orders over ₹999 across India.',
        announcementActive: true,
        returnWindowDays: 7
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStoreSettings = async (req, res) => {
  try {
    const updates = req.body;
    let settings = await StoreSettings.findOne();

    if (!settings) {
      settings = new StoreSettings();
    }

    if (updates.storeName) settings.storeName = updates.storeName.trim();
    if (updates.tagline !== undefined) settings.tagline = updates.tagline;
    if (updates.contactEmail) settings.contactEmail = updates.contactEmail.trim();
    if (updates.whatsappNumber) settings.whatsappNumber = updates.whatsappNumber.trim();
    if (updates.lowStockThreshold !== undefined) settings.lowStockThreshold = parseInt(updates.lowStockThreshold, 10);
    if (updates.freeShippingThresholdPaise !== undefined) settings.freeShippingThresholdPaise = parseInt(updates.freeShippingThresholdPaise, 10);
    if (updates.announcementText !== undefined) settings.announcementText = updates.announcementText;
    if (updates.announcementActive !== undefined) settings.announcementActive = Boolean(updates.announcementActive);
    if (updates.returnWindowDays !== undefined) settings.returnWindowDays = parseInt(updates.returnWindowDays, 10);

    await settings.save();

    await recordAudit(req.user?.email, 'SETTINGS_UPDATED', 'StoreSettings', settings._id, updates);

    res.json({
      success: true,
      message: 'Store settings saved successfully',
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne() || {
      storeName: 'BLANC ATELIER',
      tagline: 'Architectural Minimalist Streetwear & Studio POD',
      contactEmail: 'concierge@blancatelier.com',
      whatsappNumber: '+91 98765 43210',
      currency: 'INR',
      freeShippingThresholdPaise: 99900,
      announcementText: 'Complimentary standard shipping on all orders over ₹999 across India.',
      announcementActive: true,
      returnWindowDays: 7
    };

    res.json({
      success: true,
      settings: {
        storeName: settings.storeName,
        tagline: settings.tagline,
        contactEmail: settings.contactEmail,
        whatsappNumber: settings.whatsappNumber,
        currency: settings.currency,
        freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
        announcementText: settings.announcementText,
        announcementActive: settings.announcementActive,
        returnWindowDays: settings.returnWindowDays
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
