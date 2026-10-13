const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/verify', paymentController.verifyPayment);
router.post('/failure', paymentController.recordPaymentFailure);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
