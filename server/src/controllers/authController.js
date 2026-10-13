const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const emailService = require('../services/emailService');
const { JWT_SECRET } = require('../middleware/auth');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);

/**
 * 1. Request Signup OTP
 */
exports.requestSignupOtp = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check resend cooldown
    const activeOtp = await OtpToken.findOne({
      email: trimmedEmail,
      purpose: 'signup',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (activeOtp && activeOtp.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil((activeOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        cooldownSeconds: waitSeconds
      });
    }

    // Invalidate previous signup OTPs
    await OtpToken.updateMany(
      { email: trimmedEmail, purpose: 'signup', isUsed: false },
      { $set: { isUsed: true } }
    );

    // Generate cryptographically secure random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const passwordHash = await bcrypt.hash(password, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);

    await OtpToken.create({
      email: trimmedEmail,
      otpHash,
      purpose: 'signup',
      pendingUserData: {
        name: name.trim(),
        passwordHash,
        phone: phone ? phone.trim() : ''
      },
      expiresAt,
      resendAvailableAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
      attempts: 0
    });

    // Send email via Nodemailer
    await emailService.sendSignupOtp({
      email: trimmedEmail,
      name: name.trim(),
      otp,
      expiryMinutes: OTP_EXPIRY_MINUTES
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${trimmedEmail}.`,
      email: trimmedEmail,
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      expiresInMinutes: OTP_EXPIRY_MINUTES
    });
  } catch (err) {
    console.error('Request signup OTP error:', err);
    res.status(500).json({ success: false, message: 'Could not send verification code: ' + err.message });
  }
};

/**
 * 2. Verify Signup OTP and Activate/Create Account
 */
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const otpRecord = await OtpToken.findOne({
      email: trimmedEmail,
      purpose: 'signup',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this email. Please request a new code.'
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`
      });
    }

    // Invalidate OTP immediately upon successful verification
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check race condition for existing user
    let user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      user = new User({
        name: otpRecord.pendingUserData.name,
        email: trimmedEmail,
        passwordHash: otpRecord.pendingUserData.passwordHash,
        phone: otpRecord.pendingUserData.phone || '',
        role: 'customer',
        isEmailVerified: true
      });
      await user.save();
    } else {
      user.isEmailVerified = true;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Email verified successfully! Account created.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        themePreference: user.themePreference || 'light',
        addresses: user.addresses || []
      }
    });
  } catch (err) {
    console.error('Verify signup OTP error:', err);
    res.status(500).json({ success: false, message: 'Verification error: ' + err.message });
  }
};

/**
 * 3. Request Forgot-Password OTP (Privacy-Safe)
 */
exports.requestForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Registered email address is required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    // Always respond with generic message to avoid email enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address, a verification code has been sent.',
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS
    };

    if (!user || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    // Check resend cooldown
    const activeOtp = await OtpToken.findOne({
      email: trimmedEmail,
      purpose: 'forgot_password',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (activeOtp && activeOtp.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil((activeOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new reset code.`,
        cooldownSeconds: waitSeconds
      });
    }

    // Invalidate previous reset OTPs
    await OtpToken.updateMany(
      { email: trimmedEmail, purpose: 'forgot_password', isUsed: false },
      { $set: { isUsed: true } }
    );

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);

    await OtpToken.create({
      email: trimmedEmail,
      otpHash,
      purpose: 'forgot_password',
      expiresAt,
      resendAvailableAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
      attempts: 0
    });

    await emailService.sendForgotPasswordOtp({
      email: trimmedEmail,
      otp,
      expiryMinutes: OTP_EXPIRY_MINUTES
    });

    res.status(200).json(genericResponse);
  } catch (err) {
    console.error('Request forgot password OTP error:', err);
    res.status(500).json({ success: false, message: 'Could not process password reset request.' });
  }
};

/**
 * 4. Verify Forgot-Password OTP and issue temporary reset authorization token
 */
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const otpRecord = await OtpToken.findOne({
      email: trimmedEmail,
      purpose: 'forgot_password',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active reset request found for this email. Please request a new code.'
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(429).json({
        success: false,
        message: 'Maximum attempts exceeded. Please request a new code.'
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`
      });
    }

    // Mark OTP as verified and issue secure reset authorization token valid for 10 minutes
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    otpRecord.isUsed = true;
    otpRecord.resetTokenHash = resetTokenHash;
    otpRecord.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await otpRecord.save();

    res.json({
      success: true,
      message: 'Code verified successfully. Please enter your new password.',
      resetToken: rawResetToken
    });
  } catch (err) {
    console.error('Verify forgot password OTP error:', err);
    res.status(500).json({ success: false, message: 'Verification error: ' + err.message });
  }
};

/**
 * 5. Complete Password Reset
 */
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const validRecord = await OtpToken.findOne({
      email: trimmedEmail,
      purpose: 'forgot_password',
      resetTokenHash,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!validRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset authorization. Please start over.'
      });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Hash new password securely
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Invalidate reset authorization token and all OTPs for this email
    validRecord.resetTokenHash = null;
    await validRecord.save();
    await OtpToken.deleteMany({ email: trimmedEmail, purpose: 'forgot_password' });

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset error: ' + err.message });
  }
};

/**
 * 6. Direct Register (kept for seeds and backward-compatibility with tests)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone ? phone.trim() : '',
      role: 'customer',
      isEmailVerified: true
    });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        themePreference: user.themePreference,
        addresses: user.addresses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 7. Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        themePreference: user.themePreference || 'light',
        addresses: user.addresses || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, themePreference } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (themePreference && ['light', 'dark', 'system'].includes(themePreference)) {
      user.themePreference = themePreference;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Personal details updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        themePreference: user.themePreference,
        addresses: user.addresses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const normalizeString = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isDuplicateAddress = (addrA, addrB) => {
  if (!addrA || !addrB) return false;
  const line1Match = normalizeString(addrA.addressLine1) === normalizeString(addrB.addressLine1);
  const cityMatch = normalizeString(addrA.city) === normalizeString(addrB.city);
  const pinMatch = normalizeString(addrA.postalCode) === normalizeString(addrB.postalCode);
  const phoneMatch = normalizeString(addrA.phone).slice(-10) === normalizeString(addrB.phone).slice(-10);
  const nameMatch = normalizeString(addrA.fullName) === normalizeString(addrB.fullName);
  return line1Match && cityMatch && pinMatch && phoneMatch && nameMatch;
};

const sortAddresses = (addresses = []) => {
  return [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    return timeB - timeA;
  });
};

const validateAddressInput = (data) => {
  const errors = [];
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full recipient name is required (at least 2 characters).');
  }
  const cleanPhone = (data.phone || '').replace(/[\s-]/g, '');
  if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.push('Valid 10-digit Indian mobile number is required.');
  }
  if (!data.addressLine1 || data.addressLine1.trim().length < 5) {
    errors.push('Street address / Flat number is required (at least 5 characters).');
  }
  if (!data.city || data.city.trim().length < 2) {
    errors.push('City is required.');
  }
  if (!data.state || data.state.trim().length < 2) {
    errors.push('State is required.');
  }
  const cleanPin = (data.postalCode || '').trim();
  if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
    errors.push('Valid 6-digit Indian PIN code is required.');
  }
  return errors;
};

exports.sortAddresses = sortAddresses;
exports.isDuplicateAddress = isDuplicateAddress;
exports.validateAddressInput = validateAddressInput;

/**
 * Get current customer's addresses (Default first, stable secondary sort)
 */
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, addresses: sortAddresses(user.addresses || []) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add a new delivery address
 */
exports.addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'IN',
      label = 'Home',
      deliveryInstructions = '',
      isDefault
    } = req.body;

    const validationErrors = validateAddressInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Address validation failed', errors: validationErrors });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Deduplication check
    const existingIndex = user.addresses.findIndex(addr => isDuplicateAddress(addr, req.body));
    if (existingIndex !== -1) {
      if (isDefault) {
        user.addresses.forEach((a, idx) => {
          a.isDefault = idx === existingIndex;
        });
        await user.save();
      }
      return res.json({
        success: true,
        message: 'Address already exists in your address book.',
        isDuplicate: true,
        addresses: sortAddresses(user.addresses),
        address: user.addresses[existingIndex]
      });
    }

    const willBeDefault = !!isDefault || user.addresses.length === 0;

    if (willBeDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    const newAddr = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: (addressLine2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: (country || 'IN').trim().toUpperCase(),
      label: ['Home', 'Work', 'Other'].includes(label) ? label : 'Home',
      deliveryInstructions: (deliveryInstructions || '').trim(),
      isDefault: willBeDefault
    };

    user.addresses.push(newAddr);
    await user.save();

    const savedAddr = user.addresses[user.addresses.length - 1];
    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      addresses: sortAddresses(user.addresses),
      address: savedAddr
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Edit an existing address
 */
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'IN',
      label = 'Home',
      deliveryInstructions,
      isDefault
    } = req.body;

    const validationErrors = validateAddressInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Address validation failed', errors: validationErrors });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    if (isDefault) {
      user.addresses.forEach(a => {
        a.isDefault = a._id.toString() === addressId;
      });
    }

    addr.fullName = fullName.trim();
    addr.phone = phone.trim();
    addr.addressLine1 = addressLine1.trim();
    addr.addressLine2 = (addressLine2 || '').trim();
    addr.city = city.trim();
    addr.state = state.trim();
    addr.postalCode = postalCode.trim();
    addr.country = (country || 'IN').trim().toUpperCase();
    if (['Home', 'Work', 'Other'].includes(label)) addr.label = label;
    if (deliveryInstructions !== undefined) addr.deliveryInstructions = deliveryInstructions.trim();

    if (isDefault !== undefined && !isDefault && addr.isDefault) {
      const other = user.addresses.find(a => a._id.toString() !== addressId);
      if (other) {
        other.isDefault = true;
        addr.isDefault = false;
      }
    }

    // Ensure at least one default remains
    const hasDefault = user.addresses.some(a => a.isDefault);
    if (!hasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({
      success: true,
      message: 'Address updated successfully.',
      addresses: sortAddresses(user.addresses),
      address: addr
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete an address with safe fallback default assignment
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const targetAddr = user.addresses.id(addressId);
    if (!targetAddr) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    const wasDefault = targetAddr.isDefault;
    user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);

    // If deleted address was default, promote another address to default safely
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({
      success: true,
      message: 'Address removed successfully.',
      addresses: sortAddresses(user.addresses)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Set an existing address as default (Atomic unset of other addresses)
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const target = user.addresses.id(addressId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    user.addresses.forEach(a => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();
    res.json({
      success: true,
      message: 'Default address updated successfully.',
      addresses: sortAddresses(user.addresses)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
