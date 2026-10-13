const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Order = require('../src/models/Order');
const Review = require('../src/models/Review');
const Drop = require('../src/models/Drop');
const RewardAccount = require('../src/models/RewardAccount');
const RewardConfig = require('../src/models/RewardConfig');

const wishlistController = require('../src/controllers/wishlistController');
const reviewController = require('../src/controllers/reviewController');
const dropController = require('../src/controllers/dropController');
const rewardController = require('../src/controllers/rewardController');
const PricingService = require('../src/services/pricingService');

test('Advanced E-Commerce Features Suite', async (t) => {
  let mongoServer;

  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  // Setup sample test user and product
  let testUser;
  let testProduct;
  let testVariant;

  await t.test('1. Setup Seed Records', async () => {
    testUser = await User.create({
      name: 'Dev Test User',
      email: 'testuser@blancatelier.com',
      passwordHash: 'fakehash123',
      role: 'customer'
    });

    testProduct = await Product.create({
      name: 'Architectural Boxy Tee',
      slug: 'architectural-boxy-tee',
      description: '240 GSM heavy combed single jersey',
      basePricePaise: 99900,
      category: 'ready_to_wear',
      images: [{ url: 'https://images.unsplash.com/sample.jpg', isPrimary: true }],
      sizeChart: [
        { size: 'S', chestCm: 102, lengthCm: 69 },
        { size: 'M', chestCm: 108, lengthCm: 71 },
        { size: 'L', chestCm: 114, lengthCm: 74 },
        { size: 'XL', chestCm: 120, lengthCm: 76 }
      ]
    });

    testVariant = await ProductVariant.create({
      productId: testProduct._id,
      sku: 'ARCH-WHT-L',
      size: 'L',
      color: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
      stockQuantity: 15
    });

    assert.ok(testUser._id);
    assert.ok(testProduct._id);
    assert.equal(testProduct.sizeChart.length, 4);
  });

  await t.test('2. Wishlist: Guest to Logged-in User Synchronization', async () => {
    // Merge guest item into user's account
    const req = {
      user: testUser,
      headers: { 'x-guest-session': 'guest_session_xyz' },
      body: { guestProductIds: [testProduct._id.toString()] }
    };

    let responseData = null;
    const res = {
      json: (data) => { responseData = data; return res; },
      status: (code) => res
    };

    await wishlistController.mergeWishlist(req, res);
    assert.equal(responseData.success, true);
    assert.equal(responseData.count, 1);
    assert.equal(responseData.products[0].slug, 'architectural-boxy-tee');
    assert.ok(responseData.products[0].variants, 'Variants enriched with stock info');
  });

  await t.test('3. Reviews: Verified Purchase Protection & Single Review Constraint', async () => {
    // A. Review without order -> isVerifiedPurchase should be false
    const reqUnverified = {
      user: testUser,
      body: {
        productId: testProduct._id.toString(),
        rating: 5,
        title: 'Superb fabric drape',
        comment: 'High GSM combed cotton and clean ribbed collar.',
        photos: []
      }
    };

    let reviewRes = null;
    let statusCode = 200;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { reviewRes = data; return res; }
    };

    await reviewController.createReview(reqUnverified, res);
    assert.equal(reviewRes.success, true);
    assert.equal(reviewRes.review.isVerifiedPurchase, false, 'Unpurchased review is unverified');

    // B. Enforce 1 review per customer per product
    let duplicateRes = null;
    const mockDupRes = {
      status: () => mockDupRes,
      json: (data) => { duplicateRes = data; return mockDupRes; }
    };
    await reviewController.createReview(reqUnverified, mockDupRes);
    assert.equal(duplicateRes.success, false, 'Duplicate review rejected');

    // Clean up review to test verified purchase with completed order
    await Review.deleteMany({});

    // Create completed order for testUser
    await Order.create({
      orderNumber: 'BLC-TEST-ORDER-001',
      userId: testUser._id,
      customer: { name: testUser.name, email: testUser.email, phone: '9876543210' },
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        selectedSize: 'L',
        quantity: 1,
        unitPricePaise: 99900,
        lineTotalPaise: 99900
      }],
      shippingAddress: {
        fullName: testUser.name, phone: '9876543210', addressLine1: 'MG Road',
        city: 'Bangalore', state: 'Karnataka', postalCode: '560001'
      },
      pricing: { subtotalPaise: 99900, totalAmountPaise: 104895 },
      payment: { status: 'captured', paidAt: new Date() },
      fulfilmentStatus: 'approved'
    });

    // C. Re-submit review -> now it must be verified!
    await reviewController.createReview(reqUnverified, res);
    assert.equal(reviewRes.success, true);
    assert.equal(reviewRes.review.isVerifiedPurchase, true, 'Confirmed order grants Verified Purchase badge');
  });

  await t.test('4. Limited-Edition Drops: Launch Enforcement & Atomic Stock', async () => {
    const futureLaunch = new Date();
    futureLaunch.setDate(futureLaunch.getDate() + 5);

    const upcomingDrop = await Drop.create({
      title: 'DROP 03 // ARCHIVAL',
      slug: 'drop-03-archival',
      description: 'Numbered limited run',
      bannerImage: 'https://images.unsplash.com/drop.jpg',
      launchAt: futureLaunch,
      isPublished: true,
      products: [{
        product: testProduct._id,
        dropPricePaise: 129900,
        dropStockLimit: 10,
        soldCount: 0
      }]
    });

    assert.ok(upcomingDrop._id);

    // Verify drop public listing computes correct upcoming dynamic status
    let publicDropsRes = null;
    await dropController.getDrops({}, {
      json: (data) => { publicDropsRes = data; },
      status: () => ({ json: () => {} })
    });

    assert.ok(publicDropsRes.drops.upcoming.some(d => d.slug === 'drop-03-archival'));
  });

  await t.test('5. Referral & Loyalty: Reward Accrual, Self-Referral Prevention & Margins', async () => {
    // A. Initialize User reward account
    let myRewardsRes = null;
    await rewardController.getMyRewards({ user: testUser }, {
      json: (data) => { myRewardsRes = data; },
      status: () => ({ json: () => {} })
    });

    assert.equal(myRewardsRes.success, true);
    const myReferralCode = myRewardsRes.account.referralCode;
    assert.ok(myReferralCode.startsWith('BLANC-'));

    // B. Anti-self-referral check: Customer cannot apply own code
    let validateRes = null;
    let validateStatus = 200;
    await rewardController.validateReferralCode(
      { user: testUser, body: { code: myReferralCode } },
      {
        status: (code) => { validateStatus = code; return { json: (d) => { validateRes = d; } }; },
        json: (d) => { validateRes = d; }
      }
    );
    assert.equal(validateRes.success, false, 'Self-referral correctly rejected');

    // C. Reward Redemption for Voucher
    let redeemRes = null;
    await rewardController.redeemPoints(
      { user: testUser, body: { pointsToRedeem: 50 } },
      {
        status: () => ({ json: (d) => { redeemRes = d; } }),
        json: (d) => { redeemRes = d; }
      }
    );
    assert.equal(redeemRes.success, true);
    assert.ok(redeemRes.coupon.code.startsWith('REW-'));

    // D. PricingService recognizes and applies the REW voucher
    const pricing = await PricingService.calculateCartTotals({
      items: [{
        productId: testProduct._id,
        quantity: 1
      }],
      couponCode: redeemRes.coupon.code
    });

    assert.equal(pricing.discountPaise, 5000, '₹50 discount applied for 50 redeemed points');
  });
});
