const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const seedDatabase = require('../src/seeds/seedData');

test('End-to-End Customer & Admin Flow Test', async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedDatabase();

  process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_sec_test_suite_key_2026';

  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;

  try {
    const guestSession = `test_sess_${Date.now()}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-guest-session': guestSession
    };

    // 1. Get products
    const prodsRes = await fetch(`${base}/products`);
    const prodsData = await prodsRes.json();
    assert.strictEqual(prodsData.success, true);
    assert.strictEqual(prodsData.products.length >= 5, true);
    const blankProd = prodsData.products.find(p => p.isCustomizable);
    console.log('✓ Catalogue loaded:', prodsData.products.length, 'products');

    // 2. Save Custom Design
    const designPayload = {
      productId: blankProd._id,
      selectedColor: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
      selectedSize: 'XL',
      sides: {
        front: {
          enabled: true,
          elements: [
            {
              id: 'el_txt_1',
              type: 'text',
              text: 'BLANC\nATELIER',
              fontFamily: 'Cormorant Garamond',
              fontSize: 36,
              colorHex: '#111111',
              textAlign: 'center',
              xPercent: 50,
              yPercent: 40
            }
          ],
          previewImageUrl: '/uploads/previews/mock_front.png'
        },
        back: {
          enabled: false,
          elements: []
        }
      }
    };

    const saveRes = await fetch(`${base}/designs/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify(designPayload)
    });
    const saveData = await saveRes.json();
    assert.strictEqual(saveData.success, true);
    assert.strictEqual(typeof saveData.designId, 'string');
    console.log('✓ Custom Design saved with stable ID:', saveData.designId, 'Price:', saveData.unitPricePaise, 'paise');

    // 3. Add to unified cart
    const addRes = await fetch(`${base}/cart/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: blankProd._id,
        isCustom: true,
        customDesignId: saveData.designId,
        designVersion: saveData.version,
        selectedSize: 'XL',
        selectedColor: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
        printLocations: ['front'],
        previewImageUrl: '/uploads/previews/mock_front.png',
        quantity: 1
      })
    });
    const addData = await addRes.json();
    assert.strictEqual(addData.success, true);
    assert.strictEqual(addData.cart.items.length, 1);
    console.log('✓ Added custom item to cart. Total:', addData.cart.totalAmountPaise, 'paise');

    // 4. Authenticate customer (Mandatory login before checkout) & Create Order
    const authRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kabir Sharma',
        email: `kabir.sharma.${Date.now()}@gmail.com`,
        password: 'Password123!',
        phone: '9876543210'
      })
    });
    const authData = await authRes.json();
    assert.strictEqual(authData.success, true);
    headers['Authorization'] = `Bearer ${authData.token}`;

    const orderRes = await fetch(`${base}/orders/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        paymentMethod: 'PREPAID',
        customer: {
          name: 'Kabir Sharma',
          email: 'kabir.sharma@gmail.com',
          phone: '9876543210'
        },
        shippingAddress: {
          fullName: 'Kabir Sharma',
          phone: '9876543210',
          addressLine1: 'Villa 14, Brigade Palm Springs',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560078'
        }
      })
    });
    const orderData = await orderRes.json();
    assert.strictEqual(orderData.success, true);
    assert.strictEqual(typeof orderData.order.orderNumber, 'string');
    assert.strictEqual(orderData.order.orderStatus, 'PENDING_PAYMENT');
    console.log('✓ Order created:', orderData.order.orderNumber, 'Payment Order:', orderData.payment.razorpayOrderId);

    // 5. Finalize payment verification with authentic HMAC-SHA256 signature
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderData.payment.razorpayOrderId}|pay_test_verified_123`)
      .digest('hex');

    const payRes = await fetch(`${base}/payment/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: orderData.order.id,
        razorpayOrderId: orderData.payment.razorpayOrderId,
        razorpayPaymentId: 'pay_test_verified_123',
        razorpaySignature: validSignature
      })
    });
    const payData = await payRes.json();
    if (!payData.success) {
      console.error('PAYMENT VERIFY FAILED:', payData);
    }
    assert.strictEqual(payData.success, true);
    assert.strictEqual(payData.order.payment.status, 'captured');
    assert.strictEqual(payData.order.orderStatus, 'CONFIRMED');
    assert.strictEqual(payData.order.paymentStatus, 'PAID');
    console.log('✓ Payment verified and captured. Order confirmed and paid.');

    // 6. Admin Login
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blancatelier.com',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    const adminToken = loginData.token;
    console.log('✓ Admin authenticated successfully.');

    // 7. Check POD Production Queue
    const queueRes = await fetch(`${base}/admin/pod-queue`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const queueData = await queueRes.json();
    assert.strictEqual(queueData.success, true);
    assert.strictEqual(queueData.jobs.length >= 1, true);
    const targetJob = queueData.jobs.find(j => j.orderNumber === orderData.order.orderNumber);
    assert.ok(targetJob, 'Target job found in production queue');
    console.log('✓ Custom order verified inside POD production queue:', targetJob.orderNumber, 'Status:', targetJob.productionStatus);

    // 8. Admin Approves Design in Pre-Press
    const approveRes = await fetch(`${base}/admin/pod-queue/${targetJob._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reviewNotes: 'DPI and typography verified by Director.' })
    });
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.success, true);
    assert.strictEqual(approveData.job.productionStatus, 'approved');
    console.log('✓ Design approved in pre-press! Status updated to "approved".');

    // 9. Move to printing and shipping with tracking
    const shipRes = await fetch(`${base}/admin/pod-queue/${targetJob._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        trackingInfo: {
          carrier: 'BlueDart Express',
          trackingNumber: 'BD987654321',
          trackingUrl: 'https://www.bluedart.com/tracking?track=BD987654321'
        }
      })
    });
    const shipData = await shipRes.json();
    assert.strictEqual(shipData.success, true);
    console.log('✓ Order dispatched and tracking assigned: BlueDart BD987654321');

    // 10. Customer tracks package
    const trackRes = await fetch(`${base}/orders/track/${orderData.order.orderNumber}`);
    const trackData = await trackRes.json();
    assert.strictEqual(trackData.success, true);
    assert.strictEqual(trackData.trackingInfo.fulfilmentStatus, 'shipped');
    assert.strictEqual(trackData.trackingInfo.tracking.trackingNumber, 'BD987654321');
    console.log('✓ Customer live tracking verified! Status:', trackData.trackingInfo.fulfilmentStatus, 'AWB:', trackData.trackingInfo.tracking.trackingNumber);

    console.log('\n--- ALL 10 E2E CUSTOMER AND ADMIN STAGES PASSED FLAWLESSLY! ---');
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
});
