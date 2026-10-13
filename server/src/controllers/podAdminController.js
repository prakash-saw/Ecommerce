const PODJob = require('../models/PODJob');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const CustomDesign = require('../models/CustomDesign');
const PODService = require('../services/podService');
const { FULFILLMENT_MODES, POD_PRICING, PRINT_SPECIFICATIONS } = require('../config/constants');

/**
 * Print-on-Demand Production Queue
 */
exports.getPODQueue = async (req, res) => {
  try {
    const { status, providerMode } = req.query;
    const filter = {};
    if (status) filter.productionStatus = status;
    if (providerMode) filter.providerMode = providerMode;

    const jobs = await PODJob.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPODJobDetails = async (req, res) => {
  try {
    const job = await PODJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'POD Job not found' });
    }

    const design = await CustomDesign.findOne({ designId: job.customDesignId });
    const order = await Order.findById(job.orderId);

    res.json({
      success: true,
      job,
      design,
      order: order ? {
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentStatus: order.payment.status
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveJob = async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    const reviewerEmail = req.user.email;

    const job = await PODService.approveDesign({
      jobId: req.params.id,
      reviewerEmail,
      reviewNotes
    });

    res.json({ success: true, message: 'Design approved for production', job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.rejectJob = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const reviewerEmail = req.user.email;

    const job = await PODService.rejectDesign({
      jobId: req.params.id,
      reviewerEmail,
      rejectionReason
    });

    res.json({ success: true, message: 'Design rejected and customer notified', job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status, trackingInfo } = req.body;
    const adminEmail = req.user.email;

    const job = await PODService.updateProductionStatus({
      jobId: req.params.id,
      status,
      trackingInfo,
      adminEmail
    });

    res.json({ success: true, message: `POD status updated to ${status}`, job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Orders Management
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { paymentStatus, fulfilmentStatus } = req.query;
    const filter = {};
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (fulfilmentStatus) filter.fulfilmentStatus = fulfilmentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderFulfilment = async (req, res) => {
  try {
    const { fulfilmentStatus, tracking } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (fulfilmentStatus) order.fulfilmentStatus = fulfilmentStatus;
    if (tracking) {
      order.tracking = {
        carrier: tracking.carrier || order.tracking.carrier,
        trackingNumber: tracking.trackingNumber || order.tracking.trackingNumber,
        trackingUrl: tracking.trackingUrl || order.tracking.trackingUrl,
        shippedAt: new Date()
      };
      if (fulfilmentStatus !== 'delivered') {
        order.fulfilmentStatus = 'shipped';
      }
    }

    order.auditLog.push({
      actor: req.user.email,
      action: 'ADMIN_UPDATE_FULFILMENT',
      note: `Fulfilment set to ${order.fulfilmentStatus}`
    });

    await order.save();
    res.json({ success: true, message: 'Order updated', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Settings & System Diagnostics
 */
exports.getSettings = async (req, res) => {
  res.json({
    success: true,
    settings: {
      fulfillmentMode: PODService.mode,
      pricing: POD_PRICING,
      specifications: PRINT_SPECIFICATIONS,
      providerConfigured: false, // Manual workshop fulfillment active; third-party provider integration unverified
      paymentConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    }
  });
};
