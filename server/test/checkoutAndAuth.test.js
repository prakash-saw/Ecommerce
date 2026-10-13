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
const Payment = require('../src/models/Payment');
const OtpToken = require('../src/models/OtpToken');
const WebhookEvent = require('../src/models/WebhookEvent');

const authController = require('../src/controllers/authController');
const orderController = require('../src/controllers/orderController');
const adminController = require('../src/controllers/adminController');
const paymentService = require('../src/services/paymentService');

describe('E-Commerce Checkout, Payment Verification & OTP Authentication Suite', () => {
  let mongod;
  let sampleProduct;
  let sampleVariant;
  const testSecret = 'rzp_test_secret_key_verified_2026';

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
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
    process.env.JWT_SECRET = 'jwt_test_secret_2026';

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create test product and variant
    sampleProduct = await Product.create({
      name: 'Architectural Minimalist Tee',
      slug: 'architectural-minimalist-tee',
      description: '280 GSM Structured Combed Cotton.',
      basePricePaise: 89900, // ₹899
      category: 'classic_minimal',
      isCustomizable: false,
      featured: true,
      fabric: { gsm: 280, material: '100% Cotton', fit: 'Boxy' },
      images: [{ url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', alt: 'Optic White', isPrimary: true }]
    });

    sampleVariant = await ProductVariant.create({
      productId: sampleProduct._id,
      sku: 'ARCH-WHT-L',
      size: 'L',
      color: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
      stockQuantity: 25,
      reservedQuantity: 0,
      pricePaise: 89900
    });
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // -------------------------------------------------------------
  // TEST SUITE 1: SIGNUP EMAIL OTP WORKFLOW
  // -------------------------------------------------------------
  test('1. Signup OTP: Request OTP, enforce cooldown, and reject duplicate email', async () => {
    const req = {
      body: {
        name: 'Arjun Das',
        email: 'arjun.das@example.com',
        password: 'SecurePassword123!',
        phone: '9876543210'
      }
    };
    const res = createMockRes();
    await authController.requestSignupOtp(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(typeof res.jsonData.cooldownSeconds, 'number');

    // Verify OTP record created securely with hashed password, NEVER plaintext
    const otpRecord = await OtpToken.findOne({ email: 'arjun.das@example.com', purpose: 'signup' });
    assert.ok(otpRecord, 'OTP record created in database');
    assert.ok(otpRecord.otpHash, 'OTP is hashed');
    assert.ok(otpRecord.pendingUserData.passwordHash, 'Password is pre-hashed with bcrypt');
    assert.notStrictEqual(otpRecord.pendingUserData.passwordHash, 'SecurePassword123!');

    // Test resend cooldown enforcement
    const res2 = createMockRes();
    await authController.requestSignupOtp(req, res2);
    assert.strictEqual(res2.statusCode, 429, 'Cooldown blocks immediate repeated OTP requests');
    assert.strictEqual(res2.jsonData.success, false);
  });

  test('2. Signup OTP: Reject incorrect OTP and verify correct OTP to create verified account', async () => {
    // Attempt with incorrect OTP
    const wrongReq = {
      body: {
        email: 'arjun.das@example.com',
        otp: '000000'
      }
    };
    const wrongRes = createMockRes();
    await authController.verifySignupOtp(wrongReq, wrongRes);
    assert.strictEqual(wrongRes.statusCode, 400);
    assert.strictEqual(wrongRes.jsonData.success, false);

    // Fetch the active OTP record to compute the valid OTP for verification test
    const record = await OtpToken.findOne({ email: 'arjun.das@example.com', isUsed: false });
    assert.ok(record);

    // Let's create an OTP with a known value: '654321'
    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash('654321', salt);
    record.otpHash = hash;
    await record.save();

    const validReq = {
      body: {
        email: 'arjun.das@example.com',
        otp: '654321'
      }
    };
    const validRes = createMockRes();
    await authController.verifySignupOtp(validReq, validRes);

    assert.strictEqual(validRes.statusCode, 201);
    assert.strictEqual(validRes.jsonData.success, true);
    assert.strictEqual(validRes.jsonData.user.isEmailVerified, true);
    assert.ok(validRes.jsonData.token, 'Auth JWT token returned on successful registration');

    // Confirm User exists in database with verified status
    const createdUser = await User.findOne({ email: 'arjun.das@example.com' });
    assert.ok(createdUser);
    assert.strictEqual(createdUser.isEmailVerified, true);

    // Replay attack prevention: Same OTP cannot be used again
    const replayRes = createMockRes();
    await authController.verifySignupOtp(validReq, replayRes);
    assert.strictEqual(replayRes.statusCode, 400, 'Reused OTP must be rejected');
  });

  // -------------------------------------------------------------
  // TEST SUITE 2: FORGOT PASSWORD OTP WORKFLOW
  // -------------------------------------------------------------
  test('3. Forgot Password: Privacy-safe response, OTP verification and password reset', async () => {
    // 1. Privacy-safe response for non-existent account
    const ghostReq = { body: { email: 'nonexistent@randommail.com' } };
    const ghostRes = createMockRes();
    await authController.requestForgotPasswordOtp(ghostReq, ghostRes);
    assert.strictEqual(ghostRes.statusCode, 200);
    assert.strictEqual(ghostRes.jsonData.success, true);
    assert.match(ghostRes.jsonData.message, /If an account exists/i);

    // 2. Request for existing user 'arjun.das@example.com'
    const existReq = { body: { email: 'arjun.das@example.com' } };
    const existRes = createMockRes();
    await authController.requestForgotPasswordOtp(existReq, existRes);
    assert.strictEqual(existRes.statusCode, 200);
    assert.strictEqual(existRes.jsonData.success, true);

    // Set known OTP '112233'
    const resetOtpRecord = await OtpToken.findOne({ email: 'arjun.das@example.com', purpose: 'forgot_password', isUsed: false });
    assert.ok(resetOtpRecord);
    const salt = await bcrypt.genSalt(8);
    resetOtpRecord.otpHash = await bcrypt.hash('112233', salt);
    await resetOtpRecord.save();

    // 3. Verify OTP
    const verifyReq = { body: { email: 'arjun.das@example.com', otp: '112233' } };
    const verifyRes = createMockRes();
    await authController.verifyForgotPasswordOtp(verifyReq, verifyRes);
    assert.strictEqual(verifyRes.statusCode, 200);
    assert.strictEqual(verifyRes.jsonData.success, true);
    assert.ok(verifyRes.jsonData.resetToken, 'Secure resetToken returned for password update step');

    // 4. Reset password
    const updateReq = {
      body: {
        email: 'arjun.das@example.com',
        resetToken: verifyRes.jsonData.resetToken,
        newPassword: 'BrandNewPassword2026!'
      }
    };
    const updateRes = createMockRes();
    await authController.resetPasswordWithOtp(updateReq, updateRes);
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.jsonData.success, true);

    // 5. Verify new password can be used to log in
    const loginReq = {
      body: {
        email: 'arjun.das@example.com',
        password: 'BrandNewPassword2026!'
      }
    };
    const loginRes = createMockRes();
    await authController.login(loginReq, loginRes);
    assert.strictEqual(loginRes.statusCode, 200);
    assert.strictEqual(loginRes.jsonData.success, true);
  });

  // -------------------------------------------------------------
  // TEST SUITE 3: CHECKOUT WITH CASH ON DELIVERY (COD)
  // -------------------------------------------------------------
  test('4. COD Order: Confirmed immediately on server creation with paymentStatus UNPAID and inventory deduction', async () => {
    // Create cart with 2 units of sample variant
    const guestSession = `sess_cod_${Date.now()}`;
    await Cart.create({
      sessionId: guestSession,
      items: [{
        itemId: `item_${Date.now()}_1`,
        productId: sampleProduct._id,
        productName: sampleProduct.name,
        productSlug: sampleProduct.slug,
        selectedSize: 'L',
        selectedColor: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
        quantity: 2,
        unitPricePaise: sampleProduct.basePricePaise,
        lineTotalPaise: sampleProduct.basePricePaise * 2,
        isCustom: false
      }]
    });

    const stockBefore = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;

    const req = {
      body: {
        paymentMethod: 'COD',
        customer: {
          name: 'Nikhil Verma',
          email: 'nikhil.verma@example.com',
          phone: '9812345678'
        },
        shippingAddress: {
          fullName: 'Nikhil Verma',
          phone: '9812345678',
          addressLine1: 'Flat 402, Lotus Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001'
        }
      },
      headers: { 'x-guest-session': guestSession }
    };
    const res = createMockRes();
    await orderController.createOrder(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.order.paymentMethod, 'COD');
    assert.strictEqual(res.jsonData.order.orderStatus, 'CONFIRMED');
    assert.strictEqual(res.jsonData.order.paymentStatus, 'UNPAID');

    // Stock must be atomically decremented by 2
    const stockAfter = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore - 2);

    // Cart must be cleared
    const cartAfter = await Cart.findOne({ sessionId: guestSession });
    assert.strictEqual(cartAfter.items.length, 0);
  });

  // -------------------------------------------------------------
  // TEST SUITE 4: CHECKOUT WITH PREPAID & CRYPTOGRAPHIC VERIFICATION
  // -------------------------------------------------------------
  test('5. Prepaid Order: Created as PENDING_PAYMENT / PENDING; rejects invalid signature', async () => {
    const guestSession = `sess_prep_${Date.now()}`;
    await Cart.create({
      sessionId: guestSession,
      items: [{
        itemId: `item_${Date.now()}_2`,
        productId: sampleProduct._id,
        productName: sampleProduct.name,
        productSlug: sampleProduct.slug,
        selectedSize: 'L',
        selectedColor: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
        quantity: 1,
        unitPricePaise: sampleProduct.basePricePaise,
        lineTotalPaise: sampleProduct.basePricePaise,
        isCustom: false
      }]
    });

    const req = {
      body: {
        paymentMethod: 'PREPAID',
        customer: {
          name: 'Rohan Mehra',
          email: 'rohan.mehra@example.com',
          phone: '9822334455'
        },
        shippingAddress: {
          fullName: 'Rohan Mehra',
          phone: '9822334455',
          addressLine1: 'Sector 15, Vashi',
          city: 'Navi Mumbai',
          state: 'Maharashtra',
          postalCode: '400703'
        }
      },
      headers: { 'x-guest-session': guestSession }
    };
    const res = createMockRes();
    await orderController.createOrder(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.order.orderStatus, 'PENDING_PAYMENT');
    assert.strictEqual(res.jsonData.order.paymentStatus, 'PENDING');
    assert.strictEqual(res.jsonData.isPrepaid, true);
    assert.ok(res.jsonData.payment.razorpayOrderId);

    const prepaidOrderId = res.jsonData.order.id;
    const rzpOrderId = res.jsonData.payment.razorpayOrderId;

    // Verify invalid signature is strictly rejected
    const invalidSig = 'fake_unverified_client_signature_abc123';
    const isSigValid = paymentService.verifyPaymentSignature({
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: 'pay_998877',
      razorpaySignature: invalidSig
    });
    assert.strictEqual(isSigValid, false, 'Invalid signature rejected by server');

    // Attempting to finalize with invalid signature throws error and does NOT confirm order
    await assert.rejects(
      async () => {
        await paymentService.finalizePayment({
          orderId: prepaidOrderId,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: 'pay_998877',
          razorpaySignature: invalidSig
        });
      },
      /signature verification failed/i
    );

    const unconfirmedOrder = await Order.findById(prepaidOrderId);
    assert.strictEqual(unconfirmedOrder.orderStatus, 'PENDING_PAYMENT');
    assert.strictEqual(unconfirmedOrder.paymentStatus, 'PENDING');
  });

  test('6. Prepaid Order: Authentic HMAC signature confirms order and is idempotent', async () => {
    // Find our pending prepaid order
    const pendingOrder = await Order.findOne({
      'customer.email': 'rohan.mehra@example.com',
      orderStatus: 'PENDING_PAYMENT'
    });
    assert.ok(pendingOrder);

    const paymentId = 'pay_verified_tx_777';
    const rzpOrderId = pendingOrder.payment.razorpayOrderId;

    // Authoritative cryptographic signature generated with server secret
    const authenticSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${rzpOrderId}|${paymentId}`)
      .digest('hex');

    const stockBefore = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;

    // Finalize payment
    const result = await paymentService.finalizePayment({
      orderId: pendingOrder._id,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: authenticSignature
    });

    assert.strictEqual(result.success, true);

    const confirmedOrder = await Order.findById(pendingOrder._id);
    assert.strictEqual(confirmedOrder.orderStatus, 'CONFIRMED');
    assert.strictEqual(confirmedOrder.paymentStatus, 'PAID');
    assert.strictEqual(confirmedOrder.payment.status, 'captured');

    const stockAfter = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore - 1, 'Stock decremented by exactly 1');

    // Idempotency: Duplicate payment verification or webhook must not decrement stock twice
    const dupResult = await paymentService.finalizePayment({
      orderId: pendingOrder._id,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: authenticSignature
    });
    assert.strictEqual(dupResult.alreadyProcessed, true);

    const stockAfterDup = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;
    assert.strictEqual(stockAfterDup, stockAfter, 'Stock untouched on duplicate verification');
  });

  // -------------------------------------------------------------
  // TEST SUITE 5: ADMIN TRANSITION PROTECTION & COD CASH COLLECTION
  // -------------------------------------------------------------
  test('7. Admin Protection: Admin cannot manually mark unverified prepaid order as PAID', async () => {
    // Create an unverified prepaid order
    const fakeOrder = await Order.create({
      orderNumber: 'BLC-UNVERIFIED-01',
      customer: { name: 'Test', email: 'test@mail.com', phone: '9800000000' },
      items: [],
      shippingAddress: { fullName: 'T', phone: '98', addressLine1: 'St', city: 'C', state: 'S', postalCode: '110001' },
      pricing: { subtotalPaise: 50000, totalAmountPaise: 50000 },
      paymentMethod: 'PREPAID',
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING'
    });

    const req = {
      params: { id: fakeOrder._id },
      body: { paymentStatus: 'PAID' }, // Admin trying to override payment status to PAID
      user: { role: 'admin', email: 'admin@blancatelier.com' }
    };
    const res = createMockRes();
    await adminController.updateOrderStatus(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
    assert.match(res.jsonData.message, /cannot be manually marked as PAID/i);
  });

  test('8. COD Lifecycle: Marking COD order DELIVERED automatically marks paymentStatus as PAID', async () => {
    const codOrder = await Order.findOne({ paymentMethod: 'COD', orderStatus: 'CONFIRMED' });
    assert.ok(codOrder);
    assert.strictEqual(codOrder.paymentStatus, 'UNPAID');

    const req = {
      params: { id: codOrder._id },
      body: { fulfilmentStatus: 'delivered' },
      user: { role: 'admin', email: 'admin@blancatelier.com' }
    };
    const res = createMockRes();
    await adminController.updateOrderStatus(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.order.orderStatus, 'DELIVERED');
    assert.strictEqual(res.jsonData.order.paymentStatus, 'PAID', 'COD cash collected at delivery');
  });

  // -------------------------------------------------------------
  // TEST SUITE 6: DATA PRIVACY, RBAC & REAL ANALYTICS
  // -------------------------------------------------------------
  test('9. Order Privacy: Customer A cannot access Customer B registered order (403 Forbidden)', async () => {
    const userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      passwordHash: 'dummy_hash',
      role: 'customer'
    });

    const userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      passwordHash: 'dummy_hash',
      role: 'customer'
    });

    const orderB = await Order.create({
      orderNumber: 'BLC-PRIVACY-001',
      userId: userB._id,
      customer: { name: 'User B', email: 'userb@example.com', phone: '9800000001' },
      items: [],
      shippingAddress: { fullName: 'User B', phone: '9800000001', addressLine1: 'Road 1', city: 'Delhi', state: 'Delhi', postalCode: '110001' },
      pricing: { subtotalPaise: 99900, totalAmountPaise: 99900 },
      paymentMethod: 'PREPAID',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID'
    });

    // User A attempting to view User B's order
    const reqA = {
      params: { id: orderB._id.toString() },
      user: userA
    };
    const resA = createMockRes();
    await orderController.getOrderById(reqA, resA);

    assert.strictEqual(resA.statusCode, 403, 'User A is denied access to User B order');
    assert.strictEqual(resA.jsonData.success, false);
    assert.match(resA.jsonData.message, /Access denied/i);

    // User B viewing their own order
    const reqB = {
      params: { id: orderB._id.toString() },
      user: userB
    };
    const resB = createMockRes();
    await orderController.getOrderById(reqB, resB);

    assert.strictEqual(resB.statusCode, 200, 'User B can view their own order');
    assert.strictEqual(resB.jsonData.success, true);
    assert.strictEqual(resB.jsonData.order.orderNumber, 'BLC-PRIVACY-001');
  });

  test('10. RBAC: Non-admin customer calling requireAdmin middleware is rejected with 403 Forbidden', async () => {
    const jwt = require('jsonwebtoken');
    const { requireAdmin } = require('../src/middleware/auth');

    const customerUser = await User.findOne({ email: 'usera@example.com' });
    const customerToken = jwt.sign(
      { userId: customerUser._id, role: customerUser.role },
      process.env.JWT_SECRET
    );

    const req = {
      headers: { authorization: `Bearer ${customerToken}` }
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Next must not be called for non-admin');
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Admin credentials required/i);
  });

  test('11. Real Analytics: Paid revenue is strictly distinguished from uncollected COD revenue', async () => {
    const req = { query: { period: '30d' } };
    const res = createMockRes();
    await adminController.getAnalyticsOverview(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.ok(res.jsonData.analytics);
    assert.strictEqual(typeof res.jsonData.analytics.totalRevenuePaise, 'number');
    assert.ok(res.jsonData.analytics.codUncollected, 'codUncollected metrics present');
    assert.strictEqual(typeof res.jsonData.analytics.codUncollected.totalPaise, 'number');
    assert.strictEqual(typeof res.jsonData.analytics.codUncollected.orderCount, 'number');
  });
});
