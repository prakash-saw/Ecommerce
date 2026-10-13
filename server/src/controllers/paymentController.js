const PaymentService = require('../services/paymentService');

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature).'
      });
    }

    const result = await PaymentService.finalizePayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order: result.order
    });
  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.recordPaymentFailure = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, failureReason } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await PaymentService.recordPaymentFailure({
      orderId,
      razorpayOrderId,
      failureReason
    });

    res.json({
      success: true,
      message: 'Payment failure recorded.',
      order
    });
  } catch (err) {
    console.error('Record failure error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const result = await PaymentService.handleWebhook({
      rawBody,
      signature,
      eventId
    });

    res.json({ status: 'ok', result });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(400).json({ status: 'error', message: err.message });
  }
};
