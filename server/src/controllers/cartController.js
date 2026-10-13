const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const CustomDesign = require('../models/CustomDesign');
const PricingService = require('../services/pricingService');

const getOrCreateCart = async (req) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.headers['x-guest-session'] || 'guest_default_session';

  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId });
  }

  if (!cart) {
    cart = await Cart.findOne({ sessionId });
  }

  if (!cart) {
    cart = new Cart({
      userId,
      sessionId,
      items: [],
      subtotalPaise: 0
    });
    await cart.save();
  } else if (userId && !cart.userId) {
    cart.userId = userId;
    await cart.save();
  }

  return cart;
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-guest-session'] || 'guest_default_session';

    let cart = null;
    if (userId) {
      cart = await Cart.findOne({ userId });
    }
    if (!cart) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({
        success: true,
        cart: {
          id: cart ? cart._id : null,
          items: [],
          subtotalPaise: 0,
          printingFeePaise: 0,
          shippingFeePaise: 0,
          discountPaise: 0,
          taxPaise: 0,
          totalAmountPaise: 0,
          appliedCoupon: null
        }
      });
    }

    const totals = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode: cart.appliedCoupon?.code
    });

    res.json({
      success: true,
      cart: {
        id: cart._id,
        items: totals.verifiedItems,
        subtotalPaise: totals.subtotalPaise,
        printingFeePaise: totals.printingFeePaise,
        shippingFeePaise: totals.shippingFeePaise,
        discountPaise: totals.discountPaise,
        taxPaise: totals.taxPaise,
        totalAmountPaise: totals.totalAmountPaise,
        appliedCoupon: totals.appliedCoupon
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const {
      productId,
      variantId,
      isCustom,
      customDesignId,
      designVersion,
      selectedSize,
      selectedColor,
      printLocations,
      previewImageUrl,
      quantity = 1
    } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    const qty = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1));

    let previewUrl = previewImageUrl || (product.images?.[0]?.url || '');
    let finalPrintLocations = printLocations || ['front'];

    if (isCustom && customDesignId) {
      const design = await CustomDesign.findOne({ designId: customDesignId });
      if (!design) {
        return res.status(404).json({ success: false, message: 'Custom design not found' });
      }
      previewUrl = design.previewThumbnail || design.sides?.front?.previewImageUrl || previewUrl;
      const calculatedLocations = [];
      if (design.sides?.front?.enabled && design.sides?.front?.elements?.length > 0) calculatedLocations.push('front');
      if (design.sides?.back?.enabled && design.sides?.back?.elements?.length > 0) calculatedLocations.push('back');
      finalPrintLocations = calculatedLocations.length > 0 ? calculatedLocations : ['front'];
    }

    // Authoritative unit price check on server
    const unitPricePaise = await PricingService.calculateItemUnitPricePaise({
      productId,
      variantId,
      isCustom: !!isCustom,
      printLocations: finalPrintLocations
    });

    const cart = await getOrCreateCart(req);

    // Check if duplicate item exists
    const existingIndex = cart.items.findIndex(i => {
      if (isCustom) {
        return i.isCustom && i.customDesignId === customDesignId && i.selectedSize === selectedSize;
      }
      return !i.isCustom && i.productId.toString() === productId && i.selectedSize === selectedSize && i.selectedColor?.id === selectedColor?.id;
    });

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qty;
      cart.items[existingIndex].lineTotalPaise = cart.items[existingIndex].quantity * unitPricePaise;
    } else {
      cart.items.push({
        itemId: `item_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        isCustom: !!isCustom,
        customDesignId: isCustom ? customDesignId : null,
        designVersion: designVersion || 1,
        selectedSize: selectedSize || 'L',
        selectedColor: selectedColor || { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
        printLocations: finalPrintLocations,
        previewImageUrl: previewUrl,
        quantity: qty,
        unitPricePaise,
        lineTotalPaise: unitPricePaise * qty
      });
    }

    await cart.save();

    const totals = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode: cart.appliedCoupon?.code
    });

    res.json({
      success: true,
      message: 'Added to cart successfully',
      cart: {
        id: cart._id,
        items: totals.verifiedItems,
        subtotalPaise: totals.subtotalPaise,
        printingFeePaise: totals.printingFeePaise,
        shippingFeePaise: totals.shippingFeePaise,
        discountPaise: totals.discountPaise,
        taxPaise: totals.taxPaise,
        totalAmountPaise: totals.totalAmountPaise,
        appliedCoupon: totals.appliedCoupon
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const cart = await getOrCreateCart(req);

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Math.min(20, qty);
      cart.items[itemIndex].lineTotalPaise = cart.items[itemIndex].quantity * cart.items[itemIndex].unitPricePaise;
    }

    await cart.save();

    const totals = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode: cart.appliedCoupon?.code
    });

    res.json({
      success: true,
      cart: {
        id: cart._id,
        items: totals.verifiedItems,
        subtotalPaise: totals.subtotalPaise,
        shippingFeePaise: totals.shippingFeePaise,
        totalAmountPaise: totals.totalAmountPaise
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req);

    cart.items = cart.items.filter(i => i.itemId !== itemId);
    await cart.save();

    const totals = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode: cart.appliedCoupon?.code
    });

    res.json({ success: true, message: 'Item removed', cart: { ...cart.toObject(), ...totals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const cart = await getOrCreateCart(req);

    const totals = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode
    });

    if (couponCode && !totals.appliedCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or ineligible coupon code. Try WELCOME10 or GENZ20 (min ₹1200).'
      });
    }

    cart.appliedCoupon = totals.appliedCoupon;
    await cart.save();

    res.json({
      success: true,
      message: totals.appliedCoupon ? `Coupon ${totals.appliedCoupon.code} applied!` : 'Coupon cleared',
      totals
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
