const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const OtpToken = require('../src/models/OtpToken');
const WebhookEvent = require('../src/models/WebhookEvent');
const CustomDesign = require('../src/models/CustomDesign');

const authController = require('../src/controllers/authController');
const productController = require('../src/controllers/productController');
const orderController = require('../src/controllers/orderController');
const designController = require('../src/controllers/designController');
const paymentController = require('../src/controllers/paymentController');
const paymentService = require('../src/services/paymentService');
const artworkService = require('../src/services/artworkService');
const { requireAuth, requireAdmin, requireVerifiedEmail } = require('../src/middleware/auth');

describe('BLANC ATELIER Audit Regression & Protection Suite', () => {
  let mongod;
  let activeProduct1, activeProduct2, draftProduct, archivedProduct;
  let variant1, variant2, variant3;
  const testSecret = 'rzp_test_secret_key_verified_2026';
  const testWebhookSecret = 'whsec_test_secret_key_2026';

  function createMockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
  }

  before(async () => {
    process.env.RAZORPAY_KEY_SECRET = testSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = testWebhookSecret;
    process.env.JWT_SECRET = 'jwt_test_secret_longer_than_32_characters_for_security_2026';

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // 1. Seed Active Products
    activeProduct1 = await Product.create({
      name: 'Oversized Heavyweight Blueprint Tee',
      slug: 'oversized-heavyweight-blueprint-tee',
      description: 'Structured boxy streetwear silhouette in 240 GSM organic cotton with architectural graphics.',
      shortDescription: '240 GSM Heavyweight Streetwear Boxy Tee',
      basePricePaise: 89900,
      category: 'graphic_tees',
      tags: ['streetwear', 'boxy', 'architectural'],
      status: 'published',
      featured: true,
      fabric: { gsm: 240, material: '100% Cotton', fit: 'Boxy' },
      images: [{ url: 'https://images.unsplash.com/photo-1521572267360', alt: 'Front', isPrimary: true }]
    });

    variant1 = await ProductVariant.create({
      productId: activeProduct1._id,
      sku: 'BLU-BLK-XL',
      size: 'XL',
      color: { id: 'black', name: 'Jet Black', hex: '#111111' },
      stockQuantity: 15,
      pricePaise: 89900
    });

    activeProduct2 = await Product.create({
      name: 'Classic Minimal French Terry Hoodie',
      slug: 'classic-minimal-french-terry-hoodie',
      description: 'Clean brushed terry fleece hoodie with ribbed cuffs.',
      shortDescription: '400 GSM Minimal Hoodie',
      basePricePaise: 149900,
      category: 'hoodies',
      tags: ['minimal', 'winter', 'fleece'],
      status: 'published',
      featured: false,
      fabric: { gsm: 400, material: '100% Combed Cotton', fit: 'Relaxed' },
      images: [{ url: 'https://images.unsplash.com/photo-1503342217505', alt: 'Hoodie', isPrimary: true }]
    });

    variant2 = await ProductVariant.create({
      productId: activeProduct2._id,
      sku: 'HOD-WHT-M',
      size: 'M',
      color: { id: 'white', name: 'Blanc White', hex: '#FFFFFF' },
      stockQuantity: 0, // Out of stock
      pricePaise: 149900
    });

    // 2. Seed Inactive Products (Draft and Archived)
    draftProduct = await Product.create({
      name: 'Unreleased Sample Raw Denim Overshirt',
      slug: 'unreleased-sample-raw-denim-overshirt',
      description: 'Internal workshop sample not yet ready for public sale.',
      basePricePaise: 299900,
      category: 'outerwear',
      status: 'draft',
      images: [{ url: 'https://images.unsplash.com/photo-1', alt: 'Sample', isPrimary: true }]
    });

    archivedProduct = await Product.create({
      name: 'Discontinued Archival Capsule Tee 2024',
      slug: 'discontinued-archival-capsule-tee-2024',
      description: 'Permanently discontinued archive piece.',
      basePricePaise: 69900,
      category: 'graphic_tees',
      status: 'archived',
      images: [{ url: 'https://images.unsplash.com/photo-2', alt: 'Archived', isPrimary: true }]
    });
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  // =========================================================================
  // 1. AUTHENTICATION & SECRETS: OTP BYPASS & UNVERIFIED CHECKOUT PROTECTION
  // =========================================================================
  test('1.1. Registration must never create email-verified account directly without OTP verification', async () => {
    const regReq = {
      body: {
        name: 'Dev Test User',
        email: 'dev.unverified@example.com',
        password: 'SecurePassword123!',
        phone: '9876543211'
      }
    };
    const regRes = createMockRes();
    await authController.register(regReq, regRes);

    assert.equal(regRes.statusCode, 201);
    assert.equal(regRes.jsonData.success, true);
    assert.equal(regRes.jsonData.user.isEmailVerified, false, 'Registered account must have isEmailVerified: false');

    const dbUser = await User.findOne({ email: 'dev.unverified@example.com' });
    assert.ok(dbUser);
    assert.equal(dbUser.isEmailVerified, false, 'Database record must have isEmailVerified: false');
  });

  test('1.2. Unverified email user is rejected from protected checkout with 403 Forbidden', async () => {
    const unverifiedUser = await User.findOne({ email: 'dev.unverified@example.com' });
    assert.ok(unverifiedUser);
    assert.equal(unverifiedUser.isEmailVerified, false);

    let nextCalled = false;
    const req = { user: unverifiedUser };
    const res = createMockRes();

    await requireVerifiedEmail(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false, 'requireVerifiedEmail must NOT call next() for unverified user');
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /verification required/i);
  });

  test('1.3. OTP verification flow successfully activates account and allows verified access', async () => {
    const email = 'otp.candidate@example.com';
    const reqOtpReq = {
      body: {
        name: 'OTP Candidate',
        email,
        password: 'Password123!',
        phone: '9988776655'
      }
    };
    const reqOtpRes = createMockRes();
    await authController.requestSignupOtp(reqOtpReq, reqOtpRes);

    assert.equal(reqOtpRes.statusCode, 200);
    assert.equal(reqOtpRes.jsonData.success, true);

    const otpDoc = await OtpToken.findOne({ email, purpose: 'signup', isUsed: false });
    assert.ok(otpDoc);

    // Overwrite with known OTP for test determinism
    const knownOtp = '987654';
    otpDoc.otpHash = await bcrypt.hash(knownOtp, 8);
    await otpDoc.save();

    // Verify with incorrect OTP first
    const badVerifyReq = { body: { email, otp: '000000' } };
    const badVerifyRes = createMockRes();
    await authController.verifySignupOtp(badVerifyReq, badVerifyRes);
    assert.equal(badVerifyRes.statusCode, 400);
    assert.match(badVerifyRes.jsonData.message, /(incorrect|invalid|expired)/i);

    // Verify with correct OTP
    const goodVerifyReq = { body: { email, otp: knownOtp } };
    const goodVerifyRes = createMockRes();
    await authController.verifySignupOtp(goodVerifyReq, goodVerifyRes);

    assert.equal(goodVerifyRes.statusCode, 201);
    assert.equal(goodVerifyRes.jsonData.success, true);
    assert.equal(goodVerifyRes.jsonData.user.isEmailVerified, true);
    assert.ok(goodVerifyRes.jsonData.token);

    const activatedUser = await User.findOne({ email });
    assert.equal(activatedUser.isEmailVerified, true);

    // Now requireVerifiedEmail should allow through
    let nextPassed = false;
    await requireVerifiedEmail({ user: activatedUser }, createMockRes(), () => { nextPassed = true; });
    assert.equal(nextPassed, true, 'Verified user must pass requireVerifiedEmail');
  });

  test('1.4. Non-admin customer calling requireAdmin is rejected with 403 Forbidden', async () => {
    const customerUser = { role: 'customer', email: 'customer@test.com' };
    const adminUser = { role: 'admin', email: 'admin@test.com' };

    let customerNext = false;
    const custRes = createMockRes();
    requireAdmin({ user: customerUser }, custRes, () => { customerNext = true; });
    assert.equal(customerNext, false);
    assert.equal(custRes.statusCode, 403);

    let adminNext = false;
    const adminRes = createMockRes();
    requireAdmin({ user: adminUser }, adminRes, () => { adminNext = true; });
    assert.equal(adminNext, true);
  });

  // =========================================================================
  // 2. SEARCH & PRODUCT FILTERS: SERVER-SIDE FILTERING & ISOLATION
  // =========================================================================
  test('2.1. Product search returns matches across name, description and tags', async () => {
    const req = {
      query: { search: 'Blueprint' }
    };
    const res = createMockRes();
    await productController.getProducts(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.products.length, 1);
    assert.equal(res.jsonData.products[0].slug, 'oversized-heavyweight-blueprint-tee');
  });

  test('2.2. Multi-attribute combined filters: category, price, size, and inStock', async () => {
    // A: Category filter
    const catReq = { query: { category: 'hoodies' } };
    const catRes = createMockRes();
    await productController.getProducts(catReq, catRes);
    assert.equal(catRes.jsonData.products.length, 1);
    assert.equal(catRes.jsonData.products[0].category, 'hoodies');

    // B: Price range filter
    const priceReq = { query: { minPrice: 70000, maxPrice: 100000 } };
    const priceRes = createMockRes();
    await productController.getProducts(priceReq, priceRes);
    assert.equal(priceRes.jsonData.products.length, 1);
    assert.equal(priceRes.jsonData.products[0].basePricePaise, 89900);

    // C: Size filter
    const sizeReq = { query: { size: 'XL' } };
    const sizeRes = createMockRes();
    await productController.getProducts(sizeReq, sizeRes);
    assert.equal(sizeRes.jsonData.products.length, 1);
    assert.equal(sizeRes.jsonData.products[0].name, 'Oversized Heavyweight Blueprint Tee');

    // D: InStock filter
    const inStockReq = { query: { inStock: 'true' } };
    const inStockRes = createMockRes();
    await productController.getProducts(inStockReq, inStockRes);
    // activeProduct1 has 15 in stock; activeProduct2 has 0 in stock
    const inStockIds = inStockRes.jsonData.products.map(p => p._id.toString());
    assert.ok(inStockIds.includes(activeProduct1._id.toString()));
    assert.ok(!inStockIds.includes(activeProduct2._id.toString()));
  });

  test('2.3. Public catalogue strictly excludes draft and archived records', async () => {
    const req = { query: {} };
    const res = createMockRes();
    await productController.getProducts(req, res);

    const returnedSlugs = res.jsonData.products.map(p => p.slug);
    assert.ok(!returnedSlugs.includes('unreleased-sample-raw-denim-overshirt'), 'Draft products must not appear in catalogue');
    assert.ok(!returnedSlugs.includes('discontinued-archival-capsule-tee-2024'), 'Archived products must not appear in catalogue');

    // Single item lookup also returns 404 for draft/archived
    const draftLookupReq = { params: { slug: 'unreleased-sample-raw-denim-overshirt' } };
    const draftLookupRes = createMockRes();
    await productController.getProductBySlug(draftLookupReq, draftLookupRes);
    assert.equal(draftLookupRes.statusCode, 404, 'Direct draft lookup must return 404');
  });

  // =========================================================================
  // 3. CUSTOM STUDIO: DESIGN OWNERSHIP ISOLATION
  // =========================================================================
  test('3.1. Customer B cannot modify or overwrite Customer A custom design', async () => {
    const customerA = await User.create({
      name: 'Customer A',
      email: 'customer.a@atelier.in',
      passwordHash: 'hash123',
      isEmailVerified: true
    });

    const customerB = await User.create({
      name: 'Customer B',
      email: 'customer.b@atelier.in',
      passwordHash: 'hash123',
      isEmailVerified: true
    });

    // Customer A creates design
    const saveReqA = {
      user: customerA,
      body: {
        designName: 'Customer A Signature Geometric Print',
        productId: activeProduct1._id.toString(),
        selectedColor: { id: 'black', name: 'Jet Black', hex: '#111111' },
        selectedSize: 'XL',
        sides: {
          front: {
            enabled: true,
            elements: [{ id: 'elem_1', type: 'text', text: 'ARCHITECTURAL' }]
          }
        }
      }
    };
    const saveResA = createMockRes();
    await designController.saveDesign(saveReqA, saveResA);
    assert.equal(saveResA.statusCode, 200);
    const createdDesignId = saveResA.jsonData.designId;
    assert.ok(createdDesignId);

    // Customer B attempts to modify Customer A's design
    const hijackReqB = {
      user: customerB,
      body: {
        designId: createdDesignId,
        designName: 'Malicious Hijacked Name',
        productId: activeProduct1._id.toString(),
        selectedColor: { id: 'black', name: 'Jet Black', hex: '#111111' },
        selectedSize: 'XL',
        sides: {
          front: {
            enabled: true,
            elements: [{ id: 'elem_hacked', type: 'text', text: 'HACKED' }]
          }
        }
      }
    };
    const hijackResB = createMockRes();
    await designController.saveDesign(hijackReqB, hijackResB);

    assert.equal(hijackResB.statusCode, 403, 'Cross-user modification must be forbidden with 403');
    assert.match(hijackResB.jsonData.message, /access denied/i);

    // Verify original design is intact
    const originalInDb = await CustomDesign.findOne({ designId: createdDesignId });
    assert.equal(originalInDb.designName, 'Customer A Signature Geometric Print');
    assert.equal(originalInDb.ownerId, customerA._id.toString());
  });

  // =========================================================================
  // 4. PAYMENTS & ORDERS: WEBHOOK IDEMPOTENCY & SIGNATURE VERIFICATION
  // =========================================================================
  test('4.1. Webhook rejects invalid signatures with 400 Bad Request', async () => {
    const req = {
      headers: {
        'x-razorpay-event-id': 'evt_bad_sig_1',
        'x-razorpay-signature': 'invalid_forged_signature_hex'
      },
      body: { event: 'payment.captured' },
      rawBody: Buffer.from(JSON.stringify({ event: 'payment.captured' }))
    };
    const res = createMockRes();
    await paymentController.handleWebhook(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /invalid.*signature/i);
  });

  test('4.2. Webhook idempotently handles duplicate payment.captured events', async () => {
    const eventId = `evt_test_${Date.now()}`;
    const payload = {
      entity: 'event',
      account_id: 'acc_test_123',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_test_idempotent_999',
            order_id: 'order_test_rzp_999',
            amount: 89900,
            status: 'captured'
          }
        }
      },
      created_at: Math.floor(Date.now() / 1000)
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const validSignature = crypto
      .createHmac('sha256', testWebhookSecret)
      .update(rawBody)
      .digest('hex');

    // First call to handleWebhook
    const firstResult = await paymentService.handleWebhook({
      rawBody,
      signature: validSignature,
      eventId
    });
    assert.equal(firstResult.status, 'success');

    // Duplicate call with identical eventId
    const secondResult = await paymentService.handleWebhook({
      rawBody,
      signature: validSignature,
      eventId
    });
    assert.equal(secondResult.status, 'already_processed', 'Duplicate webhook event must be identified as already_processed');

    // Webhook event table should only contain 1 record
    const eventRecords = await WebhookEvent.find({ eventId });
    assert.equal(eventRecords.length, 1, 'Only one atomic webhook event record should exist');
  });

  // =========================================================================
  // 5. ARTWORK PRE-PRESS VALIDATION: RESOLUTION & MIME INTEGRITY
  // =========================================================================
  test('5.1. ArtworkService rejects images with dimensions below 400x400 minimum', () => {
    const tinyValidation = artworkService.validateImageQuality({
      width: 150,
      height: 200,
      fileSizeBytes: 25000,
      mimeType: 'image/png'
    });

    assert.equal(tinyValidation.isValid, false);
    assert.ok(tinyValidation.errors.some(err => err.includes('400px')));
  });

  test('5.2. ArtworkService accepts valid dimensions and estimates DPI accurately', () => {
    const validValidation = artworkService.validateImageQuality({
      width: 2400,
      height: 3200,
      fileSizeBytes: 2 * 1024 * 1024,
      mimeType: 'image/png'
    });

    assert.equal(validValidation.isValid, true);
    assert.equal(validValidation.errors.length, 0);
    assert.ok(validValidation.estimatedDpi >= 200);
  });
});
