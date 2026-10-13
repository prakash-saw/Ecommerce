const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Order = require('../src/models/Order');
const InventoryMovement = require('../src/models/InventoryMovement');
const Coupon = require('../src/models/Coupon');
const Review = require('../src/models/Review');
const SupportTicket = require('../src/models/SupportTicket');
const StoreSettings = require('../src/models/StoreSettings');
const Collection = require('../src/models/Collection');

const adminController = require('../src/controllers/adminController');
const PricingService = require('../src/services/pricingService');

describe('Admin Dashboard Architecture & API Suite', () => {
  let mongod;
  let adminUser;
  let regularUser;
  let adminToken;
  let sampleProduct;
  let sampleVariant;

  // Mock response helper
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
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create Admin and Regular User
    adminUser = await User.create({
      name: 'BLANC Master Operator',
      email: 'admin@blancatelier.com',
      passwordHash: 'dummy_hash',
      role: 'admin'
    });

    regularUser = await User.create({
      name: 'Regular Buyer',
      email: 'customer@college.in',
      passwordHash: 'dummy_hash',
      role: 'customer'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, role: 'admin' },
      process.env.JWT_SECRET || 'blanc_dev_jwt_secret_2026_super_secure'
    );
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('1. Product Management: Create product with variant matrix and initial inventory', async () => {
    const req = {
      user: { email: adminUser.email, role: 'admin' },
      body: {
        name: 'Oversized Minimalist Tee',
        slug: 'oversized-minimalist-tee',
        description: 'Heavyweight 240 GSM architectural silhouette.',
        basePricePaise: 99900,
        compareAtPricePaise: 149900,
        costPricePaise: 38000,
        category: 'oversized',
        variants: [
          { size: 'M', stockQuantity: 30, sku: 'BLC-OMT-M' },
          { size: 'L', stockQuantity: 20, sku: 'BLC-OMT-L' }
        ]
      }
    };
    const res = createMockRes();
    await adminController.createProduct(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.product.name, 'Oversized Minimalist Tee');
    assert.equal(res.jsonData.product.variants.length, 2);

    sampleProduct = res.jsonData.product;
    sampleVariant = res.jsonData.product.variants[0];

    // Check inventory movement was logged
    const movements = await InventoryMovement.find({ productId: sampleProduct._id });
    assert.equal(movements.length, 2);
    assert.equal(movements[0].changeQuantity, 30);
  });

  test('2. Inventory Management: Atomic adjustment and audit trail', async () => {
    const req = {
      user: { email: adminUser.email, role: 'admin' },
      body: {
        variantId: sampleVariant._id,
        changeQuantity: -5,
        reason: 'Photoshoot sample allocation',
        notes: 'Sent to Mumbai lookbook studio'
      }
    };
    const res = createMockRes();
    await adminController.adjustInventory(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.variant.stockQuantity, 25);

    // Verify negative stock rejection
    const invalidReq = {
      user: { email: adminUser.email, role: 'admin' },
      body: {
        variantId: sampleVariant._id,
        changeQuantity: -100, // exceeds available stock
        reason: 'Oversell attempt'
      }
    };
    const invalidRes = createMockRes();
    await adminController.adjustInventory(invalidReq, invalidRes);
    assert.equal(invalidRes.statusCode, 400);
    assert.match(invalidRes.jsonData.message, /Cannot reduce stock below 0/);
  });

  test('3. Order Lifecycle: Fulfilment updates, tracking, and cancellation with restock', async () => {
    // Create an order
    const order = await Order.create({
      orderNumber: 'BLC-TEST-001',
      userId: regularUser._id,
      customer: {
        name: 'Arjun Verma',
        email: 'arjun@iitb.ac.in',
        phone: '+91 9988776655'
      },
      items: [{
        productId: sampleProduct._id,
        productName: sampleProduct.name,
        productSlug: sampleProduct.slug,
        selectedSize: 'M',
        quantity: 2,
        unitPricePaise: 99900,
        lineTotalPaise: 199800
      }],
      shippingAddress: {
        fullName: 'Arjun Verma',
        phone: '+91 9988776655',
        addressLine1: 'Hostel 12, IIT Bombay',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400076'
      },
      pricing: {
        subtotalPaise: 199800,
        shippingFeePaise: 0,
        discountPaise: 0,
        taxPaise: 9990,
        totalAmountPaise: 209790
      },
      payment: {
        status: 'captured',
        razorpayPaymentId: 'pay_test_998811'
      },
      fulfilmentStatus: 'pending_approval'
    });

    // 1. Update status to Shipped with tracking
    const updateReq = {
      user: { email: adminUser.email, role: 'admin' },
      params: { id: order._id },
      body: {
        fulfilmentStatus: 'shipped',
        carrier: 'BlueDart Express',
        trackingNumber: 'BLU-88229911',
        trackingUrl: 'https://bluedart.com/track/BLU-88229911'
      }
    };
    const updateRes = createMockRes();
    await adminController.updateOrderStatus(updateReq, updateRes);

    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.jsonData.order.fulfilmentStatus, 'shipped');
    assert.equal(updateRes.jsonData.order.tracking.trackingNumber, 'BLU-88229911');

    // 2. Cancel order and verify stock is restored
    const currentStockBefore = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;
    const cancelReq = {
      user: { email: adminUser.email, role: 'admin' },
      params: { id: order._id },
      body: {
        reason: 'Customer requested address correction cancellation',
        restoreStock: true
      }
    };
    const cancelRes = createMockRes();
    await adminController.cancelOrder(cancelReq, cancelRes);

    assert.equal(cancelRes.statusCode, 200);
    assert.equal(cancelRes.jsonData.order.fulfilmentStatus, 'cancelled');

    const stockAfter = (await ProductVariant.findById(sampleVariant._id)).stockQuantity;
    assert.equal(stockAfter, currentStockBefore + 2); // Restored 2 items
  });

  test('4. Overview Analytics: Real DB calculations (revenue, AOV, best-sellers)', async () => {
    // Add 2 captured orders
    await Order.create({
      orderNumber: 'BLC-REV-001',
      customer: { name: 'Kavya S', email: 'kavya@gmail.com', phone: '+91 9911223344' },
      items: [{
        productId: sampleProduct._id,
        productName: sampleProduct.name,
        productSlug: sampleProduct.slug,
        selectedSize: 'M',
        quantity: 3,
        unitPricePaise: 99900,
        lineTotalPaise: 299700
      }],
      shippingAddress: {
        fullName: 'Kavya S',
        phone: '+91 9911223344',
        addressLine1: 'Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038'
      },
      pricing: {
        subtotalPaise: 299700,
        totalAmountPaise: 314685
      },
      payment: { status: 'captured' },
      fulfilmentStatus: 'in_production'
    });

    const req = { query: { period: '30d' } };
    const res = createMockRes();
    await adminController.getAnalyticsOverview(req, res);

    assert.equal(res.statusCode, 200);
    const analytics = res.jsonData.analytics;
    assert.ok(analytics.totalRevenuePaise >= 314685);
    assert.ok(analytics.totalCapturedOrders >= 1);
    assert.ok(analytics.averageOrderValuePaise > 0);
    assert.ok(Array.isArray(analytics.salesTrends));
    assert.ok(analytics.salesTrends.length === 30);
    assert.ok(analytics.bestSellers.length > 0);
  });

  test('5. Dynamic Coupons: Creation and Checkout Integration', async () => {
    // Admin creates coupon
    const createReq = {
      user: { email: adminUser.email, role: 'admin' },
      body: {
        code: 'COLLEGEFEST25',
        discountType: 'percentage',
        discountValue: 25,
        minOrderValuePaise: 150000,
        maxDiscountPaise: 50000,
        status: 'active'
      }
    };
    const createRes = createMockRes();
    await adminController.createCoupon(createReq, createRes);

    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.jsonData.coupon.code, 'COLLEGEFEST25');

    // Customer applies in checkout calculation via PricingService
    const cartTotals = await PricingService.calculateCartTotals({
      items: [
        {
          productId: sampleProduct._id,
          productName: sampleProduct.name,
          quantity: 2,
          unitPricePaise: 99900, // 199800 paise (> min 150000)
          isCustom: false
        }
      ],
      couponCode: 'COLLEGEFEST25'
    });

    assert.ok(cartTotals.appliedCoupon);
    assert.equal(cartTotals.appliedCoupon.code, 'COLLEGEFEST25');
    // 25% of 199800 is 49950 paise (< max 50000)
    assert.equal(cartTotals.discountPaise, 49950);
  });

  test('6. Support Inquiry & Review Moderation lifecycle', async () => {
    // 1. Customer submits support enquiry
    const inquiryReq = {
      body: {
        customerName: 'Rohan Mehta',
        customerEmail: 'rohan@delhi.ac.in',
        category: 'sizing',
        subject: 'Boxy fit vs oversized fit difference',
        message: 'Can you advise if S or M fits 5ft 10in lean build?'
      }
    };
    const inquiryRes = createMockRes();
    await adminController.createPublicSupportTicket(inquiryReq, inquiryRes);

    assert.equal(inquiryRes.statusCode, 201);
    assert.ok(inquiryRes.jsonData.ticketNumber.startsWith('SUP-'));

    // 2. Admin retrieves tickets
    const ticketListReq = { query: {} };
    const ticketListRes = createMockRes();
    await adminController.getSupportTickets(ticketListReq, ticketListRes);
    assert.equal(ticketListRes.statusCode, 200);
    assert.ok(ticketListRes.jsonData.tickets.length > 0);

    const ticketId = ticketListRes.jsonData.tickets[0]._id;

    // 3. Admin adds internal note and updates status
    const noteReq = {
      user: { email: adminUser.email },
      params: { id: ticketId },
      body: { note: 'Advised client to opt for size M for intended aesthetic drape.' }
    };
    const noteRes = createMockRes();
    await adminController.addSupportTicketNote(noteReq, noteRes);
    assert.equal(noteRes.statusCode, 200);

    const updateStatusReq = {
      params: { id: ticketId },
      body: { status: 'resolved' }
    };
    const updateStatusRes = createMockRes();
    await adminController.updateSupportTicket(updateStatusReq, updateStatusRes);
    assert.equal(updateStatusRes.jsonData.ticket.status, 'resolved');
  });

  test('7. Store Settings and Soft Archiving', async () => {
    // 1. Update store settings
    const settingsReq = {
      user: { email: adminUser.email },
      body: {
        storeName: 'BLANC ATELIER ATELIER',
        whatsappNumber: '+91 99999 88888',
        lowStockThreshold: 15
      }
    };
    const settingsRes = createMockRes();
    await adminController.updateStoreSettings(settingsReq, settingsRes);
    assert.equal(settingsRes.statusCode, 200);
    assert.equal(settingsRes.jsonData.settings.lowStockThreshold, 15);

    // 2. Soft archive product
    const archiveReq = {
      user: { email: adminUser.email },
      params: { id: sampleProduct._id }
    };
    const archiveRes = createMockRes();
    await adminController.archiveProduct(archiveReq, archiveRes);
    assert.equal(archiveRes.statusCode, 200);

    const archivedInDb = await Product.findById(sampleProduct._id);
    assert.equal(archivedInDb.status, 'archived');
    assert.equal(archivedInDb.isActive, false);
  });
});
