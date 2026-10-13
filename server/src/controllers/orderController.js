const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const CustomDesign = require('../models/CustomDesign');
const Drop = require('../models/Drop');
const ProductVariant = require('../models/ProductVariant');
const InventoryMovement = require('../models/InventoryMovement');
const PricingService = require('../services/pricingService');
const PaymentService = require('../services/paymentService');
const PODService = require('../services/podService');
const emailService = require('../services/emailService');
const { isDuplicateAddress } = require('./authController');

const validateIndianAddress = (address) => {
  const errors = [];
  if (!address.fullName || address.fullName.trim().length < 2) errors.push('Full name is required.');
  if (!address.phone || !/^[6-9]\d{9}$/.test(address.phone.replace(/[\s-]/g, ''))) {
    errors.push('Valid 10-digit Indian mobile number is required.');
  }
  if (!address.addressLine1 || address.addressLine1.trim().length < 5) errors.push('Street address is required.');
  if (!address.city || address.city.trim().length < 2) errors.push('City is required.');
  if (!address.state || address.state.trim().length < 2) errors.push('State is required.');
  if (!address.postalCode || !/^\d{6}$/.test(address.postalCode.trim())) {
    errors.push('Valid 6-digit Indian PIN code is required.');
  }
  return errors;
};

exports.createOrder = async (req, res) => {
  try {
    const { customer, shippingAddress, couponCode, referralCode, paymentMethod = 'PREPAID', saveAddress = true } = req.body;
    const userId = req.user ? req.user._id : null;
    const sessionId = (req.headers && req.headers['x-guest-session']) || 'guest_default_session';

    const chosenPaymentMethod = paymentMethod === 'COD' ? 'COD' : 'PREPAID';

    if (req.user && !req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required before checkout, payment initiation, or order placement.'
      });
    }

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Customer name, email and phone are required.' });
    }

    const addressErrors = validateIndianAddress(shippingAddress || {});
    if (addressErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Address validation failed', errors: addressErrors });
    }

    // Retrieve active cart
    let cart = null;
    if (userId) {
      cart = await Cart.findOne({ userId });
    }
    if (!cart || cart.items.length === 0) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Server-Side Drop Launch & Stock Enforcement
    const now = new Date();
    for (const item of cart.items) {
      const drop = await Drop.findOne({ 'products.product': item.productId, isPublished: true });
      if (drop) {
        if (now < new Date(drop.launchAt)) {
          return res.status(400).json({
            success: false,
            message: `Collection "${drop.title}" launches at ${new Date(drop.launchAt).toLocaleString('en-IN')}. Checkout is locked until launch.`
          });
        }
        // Check per-product drop stock limits
        const dropProduct = drop.products.find(p => p.product.toString() === item.productId.toString());
        if (dropProduct && dropProduct.dropStockLimit) {
          const remaining = dropProduct.dropStockLimit - (dropProduct.soldCount || 0);
          if (remaining < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Sorry, only ${Math.max(0, remaining)} units remain for drop item "${item.productId}".`
            });
          }
        }
      }

      // Check variant stock for regular items
      if (!item.isCustom) {
        const variant = await ProductVariant.findOne({
          productId: item.productId,
          size: item.selectedSize
        });
        if (variant && variant.stockQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient inventory for size "${item.selectedSize}". Only ${variant.stockQuantity} remaining.`
          });
        }
      }
    }

    // Server-side authoritative price recalculation
    const pricing = await PricingService.calculateCartTotals({
      items: cart.items,
      couponCode: couponCode || cart.appliedCoupon?.code
    });

    // Check COD Eligibility
    if (chosenPaymentMethod === 'COD') {
      // If order total exceeds ₹50,000, COD is disabled for security
      if (pricing.totalAmountPaise > 5000000) {
        return res.status(400).json({
          success: false,
          message: 'Cash on Delivery is limited to orders up to ₹50,000. Please select Prepaid payment.'
        });
      }
    }

    const orderNumber = `BLC-${Date.now().toString().slice(-5)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isCod = chosenPaymentMethod === 'COD';

    const order = new Order({
      orderNumber,
      userId,
      appliedReferralCode: referralCode || null,
      couponCode: couponCode || cart.appliedCoupon?.code || null,
      customer: {
        name: customer.name.trim(),
        email: customer.email.toLowerCase().trim(),
        phone: customer.phone.trim()
      },
      items: pricing.verifiedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        isCustom: item.isCustom,
        customDesignId: item.customDesignId,
        designVersion: item.designVersion,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        printLocations: item.printLocations,
        previewImageUrl: item.previewImageUrl,
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        lineTotalPaise: item.lineTotalPaise
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: (shippingAddress.addressLine2 || '').trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: (shippingAddress.country || 'IN').trim().toUpperCase(),
        label: shippingAddress.label || 'Home',
        deliveryInstructions: (shippingAddress.deliveryInstructions || '').trim()
      },
      pricing: {
        subtotalPaise: pricing.subtotalPaise,
        printingFeePaise: pricing.printingFeePaise,
        shippingFeePaise: pricing.shippingFeePaise,
        discountPaise: pricing.discountPaise,
        taxPaise: pricing.taxPaise,
        totalAmountPaise: pricing.totalAmountPaise
      },
      // Status lifecycle rules
      paymentMethod: chosenPaymentMethod,
      orderStatus: isCod ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentStatus: isCod ? 'UNPAID' : 'PENDING',
      orderExpiresAt: isCod ? null : new Date(Date.now() + 30 * 60 * 1000),
      payment: {
        provider: isCod ? 'cod' : 'razorpay',
        status: isCod ? 'pending' : 'pending'
      },
      fulfilmentStatus: isCod ? 'processing' : 'pending_approval',
      auditLog: [{
        actor: isCod ? 'Customer (COD)' : 'Customer (Prepaid Checkout)',
        action: isCod ? 'COD_ORDER_CONFIRMED' : 'PREPAID_ORDER_INITIATED',
        note: isCod
          ? `Cash on Delivery order created for ₹${(pricing.totalAmountPaise / 100).toFixed(2)}`
          : `Online payment checkout initiated for ₹${(pricing.totalAmountPaise / 100).toFixed(2)}`,
        timestamp: new Date()
      }]
    });

    // Lock designs so subsequent modifications don't mutate this order's history
    for (const item of pricing.verifiedItems) {
      if (item.isCustom && item.customDesignId) {
        await CustomDesign.findOneAndUpdate({ designId: item.customDesignId }, { isLocked: true });
      }
    }

    await order.save();

    // Auto-save address to user's address book if requested/new and user is logged in
    if (userId && saveAddress !== false) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const isDuplicate = (user.addresses || []).some(addr => isDuplicateAddress(addr, shippingAddress));
          if (!isDuplicate) {
            const isFirst = !user.addresses || user.addresses.length === 0;
            const willBeDefault = isFirst || !!shippingAddress.isDefault;
            if (willBeDefault) {
              user.addresses.forEach(a => { a.isDefault = false; });
            }
            user.addresses.push({
              fullName: shippingAddress.fullName.trim(),
              phone: shippingAddress.phone.trim(),
              addressLine1: shippingAddress.addressLine1.trim(),
              addressLine2: (shippingAddress.addressLine2 || '').trim(),
              city: shippingAddress.city.trim(),
              state: shippingAddress.state.trim(),
              postalCode: shippingAddress.postalCode.trim(),
              country: (shippingAddress.country || 'IN').trim().toUpperCase(),
              label: ['Home', 'Work', 'Other'].includes(shippingAddress.label) ? shippingAddress.label : 'Home',
              deliveryInstructions: (shippingAddress.deliveryInstructions || '').trim(),
              isDefault: willBeDefault
            });
            await user.save();
          }
        }
      } catch (addrErr) {
        console.warn('Address auto-save notice:', addrErr.message);
      }
    }

    // Increment drop product counters
    for (const item of pricing.verifiedItems) {
      await Drop.updateOne(
        { 'products.product': item.productId },
        { $inc: { 'products.$.soldCount': item.quantity } }
      );
    }

    if (isCod) {
      // Atomically deduct inventory immediately for confirmed COD order
      for (const item of pricing.verifiedItems) {
        if (!item.isCustom) {
          const updated = await ProductVariant.findOneAndUpdate(
            {
              productId: item.productId,
              size: item.selectedSize,
              stockQuantity: { $gte: item.quantity }
            },
            { $inc: { stockQuantity: -item.quantity } },
            { new: true }
          );

          if (updated) {
            await InventoryMovement.create({
              variantId: updated._id,
              productId: item.productId,
              sku: updated.sku,
              previousQuantity: updated.stockQuantity + item.quantity,
              newQuantity: updated.stockQuantity,
              changeQuantity: -item.quantity,
              reason: 'purchase',
              notes: `COD Order #${order.orderNumber} placed`,
              orderId: order._id,
              adminEmail: 'system@blancatelier.com'
            });
          }
        }
      }

      // Trigger POD production queue if custom items in COD order
      try {
        await PODService.createPODJobsForOrder(order);
      } catch (podErr) {
        console.warn('COD POD creation warning:', podErr.message);
      }

      // Clear customer shopping cart
      cart.items = [];
      cart.appliedCoupon = null;
      await cart.save();

      // Send COD order confirmation email asynchronously
      try {
        await emailService.sendOrderConfirmation({ order });
      } catch (emailErr) {
        console.warn('COD confirmation email warning:', emailErr.message);
      }

      return res.status(201).json({
        success: true,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          totalAmountPaise: order.pricing.totalAmountPaise,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customer: order.customer
        },
        isPrepaid: false
      });
    }

    // PREPAID ORDER FLOW
    // Create Razorpay payment intent
    const paymentIntent = await PaymentService.createPaymentOrder({
      orderId: order._id,
      amountPaise: pricing.totalAmountPaise,
      receipt: order.orderNumber
    });

    order.payment.razorpayOrderId = paymentIntent.razorpayOrderId;
    await order.save();

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmountPaise: order.pricing.totalAmountPaise,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customer: order.customer
      },
      payment: paymentIntent,
      isPrepaid: true
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Retry payment for an existing pending prepaid order
 */
exports.retryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ownership protection: If user-owned order, verify customer identity
    if (order.userId) {
      if (!req.user || (req.user._id.toString() !== order.userId.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to modify this order.' });
      }
    }

    if (req.user && !req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required before checkout, payment initiation, or order placement.'
      });
    }

    if (order.orderStatus === 'CONFIRMED' || order.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order is already confirmed and paid.'
      });
    }

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        message: 'This order has expired or been cancelled. Please initiate a new order.'
      });
    }

    // Create a new Razorpay payment intent linked to this order
    const paymentIntent = await PaymentService.createPaymentOrder({
      orderId: order._id,
      amountPaise: order.pricing.totalAmountPaise,
      receipt: `${order.orderNumber}-R${Date.now().toString().slice(-4)}`
    });

    order.payment.razorpayOrderId = paymentIntent.razorpayOrderId;
    order.paymentStatus = 'PENDING';
    order.auditLog.push({
      actor: req.user?.email || 'Customer',
      action: 'PAYMENT_RETRIED',
      note: `Generated retry payment intent ${paymentIntent.razorpayOrderId}`,
      timestamp: new Date()
    });
    await order.save();

    res.json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmountPaise: order.pricing.totalAmountPaise,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      },
      payment: paymentIntent
    });
  } catch (err) {
    console.error('Retry payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer privacy: If order is associated with a registered user, restrict access to the owner and admins
    if (order.userId) {
      if (!req.user || (req.user._id.toString() !== order.userId.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to view this order.' });
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'No order found with this tracking number' });
    }

    res.json({
      success: true,
      trackingInfo: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        fulfilmentStatus: order.fulfilmentStatus,
        tracking: order.tracking,
        rejectionReason: order.rejectionReason,
        itemsSummary: order.items.map(i => ({
          name: i.productName,
          size: i.selectedSize,
          color: i.selectedColor?.name,
          quantity: i.quantity,
          isCustom: i.isCustom,
          previewImageUrl: i.previewImageUrl
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
