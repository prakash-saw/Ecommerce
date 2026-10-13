require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const designRoutes = require('./routes/designRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicStoreRoutes = require('./routes/publicStoreRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dropRoutes = require('./routes/dropRoutes');
const rewardRoutes = require('./routes/rewardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database (only when started directly, not when required in tests)
if (require.main === module && process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    if (process.env.AUTO_SEED === 'true') {
      try {
        const Product = require('./models/Product');
        const count = await Product.countDocuments();
        if (count === 0) {
          console.log('AUTO_SEED=true detected. Seeding initial catalogue...');
          const seedDatabase = require('./seeds/seedData');
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn('Seeding check error:', seedErr.message);
      }
    }
  });
}

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allows client to consume external CDNs (fonts, unsplash images)
}));

// Security & rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Strict CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));

// Raw body capture for webhook signature verification
app.use(express.json({
  limit: '25mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving for customer artwork uploads and previews
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicStoreRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/rewards', rewardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'BLANC ATELIER',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
    podFulfillmentMode: process.env.POD_FULFILLMENT_MODE || 'manual'
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please contact support.'
      : (err.message || 'Internal server error occurred.')
  });
});

let server = null;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`✦ BLANC Atelier Backend active at http://localhost:${PORT}`);
  });

  const gracefulShutdown = async () => {
    console.log('Received shutdown signal. Closing HTTP server & MongoDB connection...');
    if (server) {
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed. Process exited.');
          process.exit(0);
        });
      });
    } else {
      await mongoose.connection.close(false);
      process.exit(0);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
