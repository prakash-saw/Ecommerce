const jwt = require('jsonwebtoken');
const User = require('../models/User');

const DEFAULT_DEV_JWT_SECRET = 'blanc_studio_super_secure_jwt_secret_2026';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length < 32 || secret === DEFAULT_DEV_JWT_SECRET) {
      throw new Error(
        '[SECURITY ERROR] Strong environment-provided JWT_SECRET (minimum 32 characters) is strictly required in production.'
      );
    }
    return secret;
  }

  if (!secret) {
    return DEFAULT_DEV_JWT_SECRET;
  }
  return secret;
};

const JWT_SECRET = process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  ? null
  : (process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET);

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Non-fatal for optional auth
    req.user = null;
  }
  next();
};

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

const requireVerifiedEmail = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required before checkout, payment initiation, or order placement.'
    });
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  try {
    let user = req.user;
    if (!user) {
      const authHeader = req.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
      }
      req.user = user;
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin credentials required' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

module.exports = {
  JWT_SECRET: JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
  getJwtSecret,
  optionalAuth,
  requireAuth,
  requireVerifiedEmail,
  requireAdmin
};
