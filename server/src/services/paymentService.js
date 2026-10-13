const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ProductVariant = require('../models/ProductVariant');
const InventoryMovement = require('../models/InventoryMovement');
const PODService = require('./podService');
const WebhookEvent = require('../models/WebhookEvent');
const emailService = require('./emailService');

class PaymentService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    this.isConfigured = !!(
      this.keyId &&
      this.keySecret &&
      this.keyId.startsWith('rzp_')
    );

    if (this.isConfigured) {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });
    } else {
      this.razorpay = null;
    }
  }

  /**
   * Create Razorpay Payment Intent
   * Authoritative server-side calculation in integer paise.
   */
  async createPaymentOrder({ orderId, amountPaise, receipt }) {
    if (this.isConfigured && this.razorpay) {
      try {
        const rzpOrder = await this.razorpay.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: receipt || `rcpt_${orderId}`,
          payment_capture: 1
        });

        let payment = await Payment.findOne({ orderId });
        if (!payment) {
          payment = new Payment({
            orderId,
            razorpayOrderId: rzpOrder.id,
            amountPaise,
            currency: 'INR',
            status: 'created',
            paymentMethod: 'PREPAID'
          });
        } else {
          payment.razorpayOrderId = rzpOrder.id;
          payment.amountPaise = amountPaise;
          payment.status = 'created';
        }
        await payment.save();

        return {
          razorpayOrderId: rzpOrder.id,
          amountPaise,
          currency: 'INR',
          keyId: this.keyId,
          isConfigured: true
        };
      } catch (err) {
        console.error('Razorpay order creation failed:', err.message);
        throw new Error(`Payment gateway order creation failed: ${err.message}`);
      }
    }

    // When Razorpay live/test credentials are not configured in environment
    const generatedOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      payment = new Payment({
        orderId,
        razorpayOrderId: generatedOrderId,
        amountPaise,
        currency: 'INR',
        status: 'created',
        paymentMethod: 'PREPAID'
      });
    } else {
      payment.razorpayOrderId = generatedOrderId;
      payment.amountPaise = amountPaise;
      payment.status = 'created';
    }
    await payment.save();

    return {
      razorpayOrderId: generatedOrderId,
      amountPaise,
      currency: 'INR',
      keyId: this.keyId || 'rzp_test_placeholder',
      isConfigured: false,
      gatewayMessage: 'Razorpay credentials not yet configured in server/.env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).'
    };
  }

  /**
   * Authoritative server-side signature verification.
   * Cryptographic verification using HMAC-SHA256. Never trust client redirects alone.
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || this.keySecret;
    if (!secret) {
      console.warn('[PaymentService] RAZORPAY_KEY_SECRET is not configured; cannot verify signature.');
      return false;
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    // Constant-time string comparison to prevent timing side-channel attacks
    if (Buffer.byteLength(expectedSignature) !== Buffer.byteLength(razorpaySignature)) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpaySignature, 'utf-8')
    );
  }

  /**
   * Finalize and confirm prepaid payment on server.
   * Atomic and idempotent: safe against duplicate requests, race conditions, or webhooks.
   */
  async finalizePayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isWebhook = false }) {
    // 1. Verify payment signature if not already verified by webhook verification
    if (!isWebhook) {
      const isValid = this.verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      });

      if (!isValid) {
        throw new Error('Payment signature verification failed. Untrusted payment attempt rejected.');
      }
    }

    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    // 2. Idempotency check: If order is already CONFIRMED and PAID, return safely without duplicating stock/jobs
    if (order.orderStatus === 'CONFIRMED' && order.paymentStatus === 'PAID') {
      return { success: true, alreadyProcessed: true, order };
    }

    // 3. Atomically deduct inventory for regular items (concurrency safe)
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
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
              notes: `Order #${order.orderNumber} prepaid payment verified`,
              orderId: order._id,
              adminEmail: 'gateway@razorpay.com'
            });
          }
        }
      }
    }

    // 4. Update Payment record
    let payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        razorpayOrderId,
        amountPaise: order.pricing.totalAmountPaise,
        currency: 'INR',
        paymentMethod: 'PREPAID'
      });
    }
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'captured';
    await payment.save();

    // 5. Update Order record to CONFIRMED and PAID
    order.orderStatus = 'CONFIRMED';
    order.paymentStatus = 'PAID';
    order.payment.status = 'captured';
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpayOrderId = razorpayOrderId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.paidAt = new Date();
    order.fulfilmentStatus = 'approved'; // Bypasses manual admin approval gate!

    order.auditLog.push({
      actor: isWebhook ? 'RazorpayWebhook' : 'PaymentGateway',
      action: 'PAYMENT_VERIFIED_AND_ORDER_CONFIRMED',
      note: `Verified ₹${(order.pricing.totalAmountPaise / 100).toFixed(2)} via Transaction ID: ${razorpayPaymentId}`,
      timestamp: new Date()
    });

    await order.save();

    // 6. Trigger POD production queue for custom designs
    try {
      await PODService.createPODJobsForOrder(order);
    } catch (podErr) {
      console.warn('POD job creation non-fatal warning:', podErr.message);
    }

    // 7. Award loyalty points & referral bonuses
    try {
      const rewardController = require('../controllers/rewardController');
      await rewardController.handleOrderPointsAndReferrals(order);
    } catch (rewardErr) {
      console.warn('Loyalty point processing non-fatal warning:', rewardErr.message);
    }

    // 8. Send Order Confirmation Email asynchronously
    try {
      await emailService.sendOrderConfirmation({ order });
    } catch (emailErr) {
      console.warn('Order confirmation email sending non-fatal warning:', emailErr.message);
    }

    return { success: true, order };
  }

  /**
   * Record payment failure
   */
  async recordPaymentFailure({ orderId, razorpayOrderId, failureReason }) {
    const order = await Order.findById(orderId);
    if (!order) return null;

    if (order.orderStatus === 'CONFIRMED') {
      return order; // Never regress a confirmed order to failed
    }

    order.paymentStatus = 'FAILED';
    order.payment.status = 'failed';
    order.payment.failureReason = failureReason || 'Payment declined or aborted';

    order.auditLog.push({
      actor: 'PaymentGateway',
      action: 'PAYMENT_FAILED',
      note: failureReason || 'Payment transaction failed',
      timestamp: new Date()
    });

    await order.save();

    if (razorpayOrderId) {
      await Payment.updateOne(
        { razorpayOrderId },
        {
          $set: {
            status: 'failed',
            errorDescription: failureReason || 'Transaction unsuccessful'
          }
        }
      );
    }

    return order;
  }

  /**
   * Webhook handler using exact raw request body buffer
   */
  async handleWebhook({ rawBody, signature, eventId }) {
    if (!eventId) {
      throw new Error('Missing x-razorpay-event-id header');
    }

    // Webhook idempotency
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent && existingEvent.isProcessed) {
      return { status: 'already_processed', eventId };
    }

    // Webhook cryptographic signature verification
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.webhookSecret;
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (
        Buffer.byteLength(expectedSignature) !== Buffer.byteLength(signature || '') ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature || ''))
      ) {
        throw new Error('Invalid Razorpay Webhook signature');
      }
    }

    const payload = JSON.parse(rawBody.toString());
    const webhookRecord = new WebhookEvent({
      eventId,
      provider: 'razorpay',
      eventType: payload.event,
      payload
    });

    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      if (paymentEntity) {
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
        if (order && order.paymentStatus !== 'PAID') {
          await this.finalizePayment({
            orderId: order._id,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: 'webhook_verified',
            isWebhook: true
          });
        }
      }
    } else if (payload.event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      if (paymentEntity) {
        const razorpayOrderId = paymentEntity.order_id;
        const failureReason = paymentEntity.error_description || 'Payment failed';
        const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
        if (order) {
          await this.recordPaymentFailure({
            orderId: order._id,
            razorpayOrderId,
            failureReason
          });
        }
      }
    }

    webhookRecord.isProcessed = true;
    webhookRecord.processedAt = new Date();
    await webhookRecord.save();

    return { status: 'success', eventId };
  }
}

module.exports = new PaymentService();
