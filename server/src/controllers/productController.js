const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

exports.getProducts = async (req, res) => {
  try {
    const { category, customizable, featured } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (customizable !== undefined) filter.isCustomizable = customizable === 'true';
    if (featured !== undefined) filter.featured = featured === 'true';

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // Populate variants for each product
    const productsWithVariants = await Promise.all(
      products.map(async (prod) => {
        const variants = await ProductVariant.find({ productId: prod._id, isActive: true });
        return {
          ...prod.toObject(),
          variants
        };
      })
    );

    res.json({ success: true, count: productsWithVariants.length, products: productsWithVariants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const variants = await ProductVariant.find({ productId: product._id, isActive: true });
    res.json({ success: true, product: { ...product.toObject(), variants } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const variants = await ProductVariant.find({ productId: product._id });
    res.json({ success: true, product: { ...product.toObject(), variants } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminController = require('./adminController');
exports.updateProduct = adminController.updateProduct;

