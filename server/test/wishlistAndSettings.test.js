const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const seedDatabase = require('../src/seeds/seedData');

test('Wishlist & Settings API Integration Test', async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedDatabase();

  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;

  try {
  const testEmail = `user_settings_${Date.now()}@example.com`;
  const guestSession = `sess_${Date.now()}`;

  // 1. Register a test user
  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Nair',
      email: testEmail,
      password: 'password123',
      phone: '9876543210'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true, 'User registered successfully');
  const userToken = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
    'x-guest-session': guestSession
  };

  // 2. Update Personal Details (Settings Feature)
  const updateRes = await fetch(`${base}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Priya M. Nair',
      phone: '9812345678',
      themePreference: 'dark'
    })
  });
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.success, true, 'Profile updated successfully');
  assert.strictEqual(updateData.user.name, 'Priya M. Nair');
  assert.strictEqual(updateData.user.phone, '9812345678');
  assert.strictEqual(updateData.user.themePreference, 'dark');

  // 3. Add Shipping Address (Settings Feature)
  const addAddrRes = await fetch(`${base}/auth/address`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Priya Nair',
      phone: '9812345678',
      addressLine1: 'Flat 5B, Skyline Tower',
      addressLine2: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      isDefault: true
    })
  });
  const addAddrData = await addAddrRes.json();
  assert.strictEqual(addAddrData.success, true, 'Address added successfully');
  assert.strictEqual(addAddrData.addresses.length, 1);
  const savedAddressId = addAddrData.addresses[0]._id;

  // 4. Update Password (Security Feature)
  const pwdRes = await fetch(`${base}/auth/password`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      currentPassword: 'password123',
      newPassword: 'newsecurepassword2026'
    })
  });
  const pwdData = await pwdRes.json();
  assert.strictEqual(pwdData.success, true, 'Password changed successfully');

  // 5. Test Wishlist Feature
  const prodsRes = await fetch(`${base}/products`);
  const prodsData = await prodsRes.json();
  const targetProduct = prodsData.products[0];

  // Toggle item INTO wishlist
  const wishToggleRes1 = await fetch(`${base}/wishlist/toggle`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: targetProduct._id })
  });
  const wishToggleData1 = await wishToggleRes1.json();
  assert.strictEqual(wishToggleData1.success, true);
  assert.strictEqual(wishToggleData1.inWishlist, true, 'Item added to wishlist');
  assert.strictEqual(wishToggleData1.count, 1);

  // Get Wishlist
  const getWishRes = await fetch(`${base}/wishlist`, {
    headers: authHeaders
  });
  const getWishData = await getWishRes.json();
  assert.strictEqual(getWishData.success, true);
  assert.strictEqual(getWishData.products.length, 1);
  assert.strictEqual(getWishData.products[0]._id, targetProduct._id);

  // Toggle item OUT of wishlist
  const wishToggleRes2 = await fetch(`${base}/wishlist/toggle`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: targetProduct._id })
  });
  const wishToggleData2 = await wishToggleRes2.json();
  assert.strictEqual(wishToggleData2.success, true);
  assert.strictEqual(wishToggleData2.inWishlist, false, 'Item removed from wishlist');
  assert.strictEqual(wishToggleData2.count, 0);

  // 6. Delete Shipping Address
  const delAddrRes = await fetch(`${base}/auth/address/${savedAddressId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const delAddrData = await delAddrRes.json();
  assert.strictEqual(delAddrData.success, true, 'Address removed successfully');
  assert.strictEqual(delAddrData.addresses.length, 0);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
});
