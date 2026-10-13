const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const CustomDesign = require('../src/models/CustomDesign');

const authController = require('../src/controllers/authController');
const orderController = require('../src/controllers/orderController');
const designController = require('../src/controllers/designController');
const { JWT_SECRET } = require('../src/middleware/auth');

describe('Customer Address Management, Protected Checkout & POD Studio Suite', () => {
  let mongod;
  let customerA;
  let customerB;
  let tokenA;
  let tokenB;
  let testProduct;
  let testVariant;

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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('SecurePassword123!', salt);

    customerA = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      passwordHash,
      phone: '9876543210',
      role: 'customer',
      isEmailVerified: true
    });

    customerB = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      passwordHash,
      phone: '9812345678',
      role: 'customer',
      isEmailVerified: true
    });

    tokenA = jwt.sign({ userId: customerA._id, role: customerA.role }, JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ userId: customerB._id, role: customerB.role }, JWT_SECRET, { expiresIn: '1h' });

    testProduct = await Product.create({
      name: 'Heavyweight Studio Tee',
      slug: 'heavyweight-studio-tee',
      description: '280 GSM Structured Combed Cotton.',
      basePricePaise: 89900,
      category: 'classic_minimal',
      isCustomizable: true,
      fabric: { gsm: 280, material: '100% Cotton', fit: 'Boxy' },
      images: [{ url: 'https://example.com/tee.jpg', alt: 'Optic White', isPrimary: true }]
    });

    testVariant = await ProductVariant.create({
      productId: testProduct._id,
      sku: 'HVY-WHT-L',
      size: 'L',
      color: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
      stockQuantity: 50,
      pricePaise: 89900
    });
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // -------------------------------------------------------------------------
  // 1. ADDRESS BOOK: AUTOMATIC DEFAULT & MULTIPLE ADDRESSES
  // -------------------------------------------------------------------------
  let address1Id;
  let address2Id;

  test('1. First address added becomes default automatically', async () => {
    const req = {
      user: customerA,
      body: {
        fullName: 'Rohan Sharma',
        phone: '9876543210',
        addressLine1: 'Flat 101, Prestige Towers',
        addressLine2: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        label: 'Home',
        country: 'IN'
      }
    };
    const res = createMockRes();
    await authController.addAddress(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.addresses.length, 1);
    assert.strictEqual(res.jsonData.addresses[0].isDefault, true);
    assert.strictEqual(res.jsonData.addresses[0].label, 'Home');

    address1Id = res.jsonData.addresses[0]._id.toString();
  });

  test('2. Adding a second address does not replace default unless specified', async () => {
    const req = {
      user: customerA,
      body: {
        fullName: 'Rohan Sharma',
        phone: '9876543210',
        addressLine1: 'Unit 402, Embassy TechVillage',
        addressLine2: 'Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        label: 'Work',
        country: 'IN',
        isDefault: false
      }
    };
    const res = createMockRes();
    await authController.addAddress(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.addresses.length, 2);

    // Default address MUST be returned FIRST
    assert.strictEqual(res.jsonData.addresses[0].isDefault, true);
    assert.strictEqual(res.jsonData.addresses[0]._id.toString(), address1Id);
    assert.strictEqual(res.jsonData.addresses[1].isDefault, false);

    address2Id = res.jsonData.addresses[1]._id.toString();
  });

  test('3. Setting second address as default atomically unsets previous default', async () => {
    const req = {
      user: customerA,
      params: { addressId: address2Id }
    };
    const res = createMockRes();
    await authController.setDefaultAddress(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);

    // The newly promoted default address must now appear FIRST
    assert.strictEqual(res.jsonData.addresses[0]._id.toString(), address2Id);
    assert.strictEqual(res.jsonData.addresses[0].isDefault, true);

    // The previous default must now have isDefault === false
    const previous = res.jsonData.addresses.find(a => a._id.toString() === address1Id);
    assert.strictEqual(previous.isDefault, false);

    // Exactly one address is default
    const defaultCount = res.jsonData.addresses.filter(a => a.isDefault).length;
    assert.strictEqual(defaultCount, 1);
  });

  test('4. Duplicate address is detected and does not create duplicate record', async () => {
    const req = {
      user: customerA,
      body: {
        fullName: 'rohan sharma',
        phone: '9876543210',
        addressLine1: 'flat 101, prestige towers',
        city: 'bengaluru',
        state: 'karnataka',
        postalCode: '560038',
        country: 'IN'
      }
    };
    const res = createMockRes();
    await authController.addAddress(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.isDuplicate, true);

    const user = await User.findById(customerA._id);
    assert.strictEqual(user.addresses.length, 2);
  });

  test('5. Editing an address persists updates and preserves default consistency', async () => {
    const req = {
      user: customerA,
      params: { addressId: address1Id },
      body: {
        fullName: 'Rohan K. Sharma',
        phone: '9876543210',
        addressLine1: 'Penthouse 901, Prestige Towers',
        addressLine2: 'Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        label: 'Home',
        deliveryInstructions: 'Leave with security gate 2'
      }
    };
    const res = createMockRes();
    await authController.updateAddress(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.address.fullName, 'Rohan K. Sharma');
    assert.strictEqual(res.jsonData.address.deliveryInstructions, 'Leave with security gate 2');
  });

  test('6. Deleting the current default address safely reassigns another remaining address as default', async () => {
    // Current default is address2Id. Let's delete address2Id.
    const req = {
      user: customerA,
      params: { addressId: address2Id }
    };
    const res = createMockRes();
    await authController.deleteAddress(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.addresses.length, 1);
    // The remaining address1Id must now automatically be marked as default
    assert.strictEqual(res.jsonData.addresses[0]._id.toString(), address1Id);
    assert.strictEqual(res.jsonData.addresses[0].isDefault, true);
  });

  test('7. Customer B cannot edit or delete Customer A address (Ownership isolation)', async () => {
    // Customer B tries to edit Customer A's address1Id
    const reqEdit = {
      user: customerB,
      params: { addressId: address1Id },
      body: {
        fullName: 'Hacker',
        phone: '9999999999',
        addressLine1: 'Compromised Street',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001'
      }
    };
    const resEdit = createMockRes();
    await authController.updateAddress(reqEdit, resEdit);
    assert.strictEqual(resEdit.statusCode, 404);

    // Customer B tries to delete Customer A's address1Id
    const reqDel = {
      user: customerB,
      params: { addressId: address1Id }
    };
    const resDel = createMockRes();
    await authController.deleteAddress(reqDel, resDel);
    assert.strictEqual(resDel.statusCode, 404);
  });

  // -------------------------------------------------------------------------
  // 2. CHECKOUT & IMMUTABLE ADDRESS SNAPSHOT
  // -------------------------------------------------------------------------
  test('8. Order creation stores immutable address snapshot that is not affected by later address edits', async () => {
    // Customer A adds item to cart
    await Cart.findOneAndUpdate(
      { userId: customerA._id },
      {
        userId: customerA._id,
        sessionId: `cart_sess_${Date.now()}`,
        items: [{
          productId: testProduct._id,
          productName: testProduct.name,
          productSlug: testProduct.slug,
          selectedSize: 'L',
          selectedColor: { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
          quantity: 1,
          unitPricePaise: 89900,
          isCustom: false
        }]
      },
      { upsert: true, new: true }
    );

    const initialAddress = {
      fullName: 'Rohan Sharma',
      phone: '9876543210',
      addressLine1: 'Penthouse 901, Prestige Towers',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'IN'
    };

    const reqOrder = {
      user: customerA,
      body: {
        paymentMethod: 'COD',
        customer: {
          name: customerA.name,
          email: customerA.email,
          phone: customerA.phone
        },
        shippingAddress: initialAddress,
        saveAddress: true
      }
    };
    const resOrder = createMockRes();
    await orderController.createOrder(reqOrder, resOrder);

    assert.strictEqual(resOrder.statusCode, 201);
    const orderId = resOrder.jsonData.order.id;

    // Mutate Customer A's address book
    const reqEdit = {
      user: customerA,
      params: { addressId: address1Id },
      body: {
        fullName: 'Rohan Sharma (Relocated)',
        phone: '9876543210',
        addressLine1: 'Different Colony, New House 42',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001'
      }
    };
    const resEdit = createMockRes();
    await authController.updateAddress(reqEdit, resEdit);
    assert.strictEqual(resEdit.statusCode, 200);

    // Verify order's shippingAddress subdocument was NOT mutated
    const savedOrder = await Order.findById(orderId);
    assert.strictEqual(savedOrder.shippingAddress.addressLine1, 'Penthouse 901, Prestige Towers');
    assert.strictEqual(savedOrder.shippingAddress.city, 'Bengaluru');
    assert.strictEqual(savedOrder.shippingAddress.state, 'Karnataka');
  });

  // -------------------------------------------------------------------------
  // 3. PRINT-ON-DEMAND STUDIO: CUSTOM DESIGN CRUD & ISOLATION
  // -------------------------------------------------------------------------
  let customDesignId;

  test('9. Save custom design with specific garment style, front/back artwork and verified price', async () => {
    const req = {
      user: customerA,
      body: {
        designName: 'Minimalist Tokyo Oversized',
        garmentStyle: 'Oversized T-Shirt',
        productId: testProduct._id,
        selectedColor: { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626' },
        selectedSize: 'XL',
        sides: {
          front: {
            enabled: true,
            elements: [{
              id: 'el_txt_1',
              type: 'text',
              text: 'TOKYO\nSTUDIO',
              fontFamily: 'Cormorant Garamond',
              fontSize: 36,
              colorHex: '#FFFFFF',
              textAlign: 'center',
              xPercent: 50,
              yPercent: 42
            }]
          },
          back: {
            enabled: true,
            elements: [{
              id: 'el_txt_2',
              type: 'text',
              text: '2026 ARCHIVAL',
              fontFamily: 'Courier New',
              fontSize: 20,
              colorHex: '#FFFFFF',
              textAlign: 'center',
              xPercent: 50,
              yPercent: 30
            }]
          }
        }
      }
    };
    const res = createMockRes();
    await designController.saveDesign(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.designName, 'Minimalist Tokyo Oversized');
    assert.strictEqual(res.jsonData.garmentStyle, 'Oversized T-Shirt');
    assert.strictEqual(res.jsonData.printLocations.length, 2); // Double sided

    customDesignId = res.jsonData.designId;
  });

  test('10. Customer A can list their saved designs and Customer B cannot see them', async () => {
    // Customer A gets my-designs
    const reqA = { user: customerA };
    const resA = createMockRes();
    await designController.getMyDesigns(reqA, resA);

    assert.strictEqual(resA.statusCode, 200);
    assert.strictEqual(resA.jsonData.count >= 1, true);
    assert.strictEqual(resA.jsonData.designs[0].designId, customDesignId);

    // Customer B gets my-designs
    const reqB = { user: customerB };
    const resB = createMockRes();
    await designController.getMyDesigns(reqB, resB);

    assert.strictEqual(resB.statusCode, 200);
    assert.strictEqual(resB.jsonData.count, 0); // Customer B has 0 designs
  });

  test('11. Customer A can duplicate a saved design', async () => {
    const req = {
      user: customerA,
      params: { designId: customDesignId }
    };
    const res = createMockRes();
    await designController.duplicateDesign(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.design.designName.includes('(Copy)'), true);
    assert.notStrictEqual(res.jsonData.design.designId, customDesignId);
  });

  test('12. Customer B cannot delete or duplicate Customer A custom design', async () => {
    const reqDel = {
      user: customerB,
      params: { designId: customDesignId }
    };
    const resDel = createMockRes();
    await designController.deleteDesign(reqDel, resDel);
    assert.strictEqual(resDel.statusCode, 403);

    const reqDup = {
      user: customerB,
      params: { designId: customDesignId }
    };
    const resDup = createMockRes();
    await designController.duplicateDesign(reqDup, resDup);
    assert.strictEqual(resDup.statusCode, 403);
  });
});
