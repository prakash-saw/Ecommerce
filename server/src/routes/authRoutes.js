const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const isTest = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification code requests. Please try again later.' }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' }
});

// Signup with Email OTP
router.post('/signup/request-otp', otpRequestLimiter, authController.requestSignupOtp);
router.post('/signup/verify-otp', otpVerifyLimiter, authController.verifySignupOtp);

// Forgot Password with Email OTP
router.post('/forgot-password/request-otp', otpRequestLimiter, authController.requestForgotPasswordOtp);
router.post('/forgot-password/verify-otp', otpVerifyLimiter, authController.verifyForgotPasswordOtp);
router.post('/forgot-password/reset', passwordResetLimiter, authController.resetPasswordWithOtp);

// Standard Login & Register
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

// Authenticated User Profile & Security
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/password', requireAuth, passwordResetLimiter, authController.updatePassword);

// Address Book APIs (Secure, customer-isolated, default-first)
router.get('/addresses', requireAuth, authController.getAddresses);
router.post('/addresses', requireAuth, authController.addAddress);
router.post('/address', requireAuth, authController.addAddress); // backwards-compatible
router.put('/addresses/:addressId', requireAuth, authController.updateAddress);
router.delete('/addresses/:addressId', requireAuth, authController.deleteAddress);
router.delete('/address/:addressId', requireAuth, authController.deleteAddress); // backwards-compatible
router.put('/addresses/:addressId/default', requireAuth, authController.setDefaultAddress);

module.exports = router;
