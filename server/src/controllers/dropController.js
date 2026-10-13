const Drop = require('../models/Drop');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

// Helper to determine drop status dynamically based on current time
const getDropStatus = (drop) => {
  const now = new Date();
  const launch = new Date(drop.launchAt);
  const ends = drop.endsAt ? new Date(drop.endsAt) : null;

  if (now < launch) return 'upcoming';
  if (ends && now > ends) return 'ended';
  return 'live';
};

// GET /api/drops (Public list)
exports.getDrops = async (req, res) => {
  try {
    const drops = await Drop.find({ isPublished: true })
      .populate({
        path: 'products.product',
        select: 'name slug basePricePaise images fabric shortDescription isCustomizable'
      })
      .sort({ launchAt: 1 });

    const now = new Date();

    const categorized = {
      live: [],
      upcoming: [],
      ended: []
    };

    drops.forEach((d) => {
      const dropObj = d.toObject();
      const status = getDropStatus(d);
      dropObj.dynamicStatus = status;
      dropObj.serverTime = now.toISOString();

      // Compute total stock and remaining stock per product
      dropObj.products = dropObj.products.map(p => {
        const remaining = p.dropStockLimit ? Math.max(0, p.dropStockLimit - (p.soldCount || 0)) : null;
        const isSoldOut = p.dropStockLimit ? remaining <= 0 : false;
        return {
          ...p,
          remainingStock: remaining,
          isSoldOut
        };
      });

      categorized[status].push(dropObj);
    });

    res.json({
      success: true,
      serverTime: now.toISOString(),
      drops: categorized
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/drops/:slug
exports.getDropBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const drop = await Drop.findOne({ slug, isPublished: true })
      .populate({
        path: 'products.product',
        populate: { path: 'variants' }
      });

    if (!drop) {
      return res.status(404).json({ success: false, message: 'Drop collection not found.' });
    }

    const dropObj = drop.toObject();
    dropObj.dynamicStatus = getDropStatus(drop);
    dropObj.serverTime = new Date().toISOString();

    // Populate variant details for products
    for (let i = 0; i < dropObj.products.length; i++) {
      const prod = dropObj.products[i].product;
      if (prod && prod._id) {
        const variants = await ProductVariant.find({ productId: prod._id, isActive: true });
        prod.variants = variants;
      }
      const remaining = dropObj.products[i].dropStockLimit
        ? Math.max(0, dropObj.products[i].dropStockLimit - (dropObj.products[i].soldCount || 0))
        : null;
      dropObj.products[i].remainingStock = remaining;
      dropObj.products[i].isSoldOut = dropObj.products[i].dropStockLimit ? remaining <= 0 : false;
    }

    res.json({
      success: true,
      drop: dropObj
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/drops/:slug/notify (Customer signs up for drop alerts)
exports.subscribeToDrop = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const drop = await Drop.findOne({ slug });
    if (!drop) {
      return res.status(404).json({ success: false, message: 'Drop not found.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const alreadySubscribed = drop.subscribers.some(s => s.email === cleanEmail);
    if (!alreadySubscribed) {
      drop.subscribers.push({ email: cleanEmail, subscribedAt: new Date() });
      await drop.save();
    }

    res.json({
      success: true,
      message: `You're on the list! We will notify ${cleanEmail} the second this drop goes live.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: GET /api/drops/admin/all
exports.getAdminDrops = async (req, res) => {
  try {
    const drops = await Drop.find()
      .populate('products.product', 'name slug basePricePaise')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      drops
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: POST /api/drops/admin
exports.createDrop = async (req, res) => {
  try {
    const { title, slug, tagline, description, bannerImage, launchAt, endsAt, products, isPublished } = req.body;

    if (!title || !slug || !description || !bannerImage || !launchAt) {
      return res.status(400).json({ success: false, message: 'Title, slug, description, banner image, and launch timestamp are required.' });
    }

    const existing = await Drop.findOne({ slug: slug.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A drop with this slug already exists.' });
    }

    const drop = new Drop({
      title: title.trim(),
      slug: slug.toLowerCase().trim(),
      tagline: (tagline || '').trim(),
      description: description.trim(),
      bannerImage: bannerImage.trim(),
      launchAt: new Date(launchAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      isPublished: isPublished !== undefined ? isPublished : true,
      products: Array.isArray(products) ? products : []
    });

    await drop.save();

    res.status(201).json({
      success: true,
      message: 'Limited edition drop created and scheduled successfully.',
      drop
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: PUT /api/drops/admin/:dropId
exports.updateDrop = async (req, res) => {
  try {
    const { dropId } = req.params;
    const updates = req.body;

    if (updates.launchAt) updates.launchAt = new Date(updates.launchAt);
    if (updates.endsAt) updates.endsAt = new Date(updates.endsAt);

    const drop = await Drop.findByIdAndUpdate(dropId, updates, { new: true });
    if (!drop) {
      return res.status(404).json({ success: false, message: 'Drop not found.' });
    }

    res.json({
      success: true,
      message: 'Drop updated successfully.',
      drop
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: DELETE /api/drops/admin/:dropId
exports.deleteDrop = async (req, res) => {
  try {
    const { dropId } = req.params;
    const drop = await Drop.findByIdAndDelete(dropId);
    if (!drop) {
      return res.status(404).json({ success: false, message: 'Drop not found.' });
    }

    res.json({
      success: true,
      message: 'Drop removed.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
