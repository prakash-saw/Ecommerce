const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Signup with Email OTP
router.post('/signup/request-otp', authController.requestSignupOtp);
router.post('/signup/verify-otp', authController.verifySignupOtp);

// Forgot Password with Email OTP
router.post('/forgot-password/request-otp', authController.requestForgotPasswordOtp);
router.post('/forgot-password/verify-otp', authController.verifyForgotPasswordOtp);
router.post('/forgot-password/reset', authController.resetPasswordWithOtp);

// Standard Login & Legacy Register (backwards-compatible)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated User Profile & Security
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/password', requireAuth, authController.updatePassword);
// Address Book APIs (Secure, customer-isolated, default-first)
router.get('/addresses', requireAuth, authController.getAddresses);
router.post('/addresses', requireAuth, authController.addAddress);
router.post('/address', requireAuth, authController.addAddress); // backwards-compatible
router.put('/addresses/:addressId', requireAuth, authController.updateAddress);
router.delete('/addresses/:addressId', requireAuth, authController.deleteAddress);
router.delete('/address/:addressId', requireAuth, authController.deleteAddress); // backwards-compatible
router.put('/addresses/:addressId/default', requireAuth, authController.setDefaultAddress);

module.exports = router;
