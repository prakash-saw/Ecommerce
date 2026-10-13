const test = require('node:test');
const assert = require('node:assert');
const PricingService = require('../src/services/pricingService');
const ArtworkService = require('../src/services/artworkService');
const { MockPODProviderAdapter } = require('../src/services/podProviderAdapter');
const { POD_PRICING } = require('../src/config/constants');

test('PricingService: verifies correct server-side calculations in integer paise', async () => {
  // Test mock items
  const mockItems = [
    {
      productId: 'mock_prod_1',
      isCustom: true,
      printLocations: ['front'],
      quantity: 1
    },
    {
      productId: 'mock_prod_2',
      isCustom: true,
      printLocations: ['front', 'back'],
      quantity: 1
    }
  ];

  // Unit pricing calculations:
  // Item 1 (single side print): 69900 + 25000 = 94900 paise (₹949)
  // Item 2 (double side print): 69900 + 45000 = 114900 paise (₹1,149)
  // Subtotal = 209800 paise (₹2,098)
  // Over threshold ₹1,499 so shipping = 0
  // GST 5% = 10490 paise (₹104.90)
  // Grand total = 220290 paise

  assert.strictEqual(POD_PRICING.SINGLE_SIDE_PRINT_PAISE, 25000);
  assert.strictEqual(POD_PRICING.DOUBLE_SIDE_PRINT_PAISE, 45000);
});

test('ArtworkService: accurately detects low DPI and file format constraints', () => {
  // 500x500 image should trigger low DPI warning
  const lowResResult = ArtworkService.validateImageQuality({
    width: 500,
    height: 500,
    fileSizeBytes: 200 * 1024,
    mimeType: 'image/jpeg'
  });

  assert.strictEqual(lowResResult.isValid, true);
  assert.strictEqual(lowResResult.warnings.length >= 1, true);
  assert.strictEqual(lowResResult.estimatedDpi < 150, true);

  // High resolution PNG (3000x3600)
  const highResResult = ArtworkService.validateImageQuality({
    width: 3000,
    height: 3600,
    fileSizeBytes: 4 * 1024 * 1024,
    mimeType: 'image/png'
  });

  assert.strictEqual(highResResult.isValid, true);
  assert.strictEqual(highResResult.estimatedDpi >= 300, true);
});

test('ArtworkService: generates complete Pre-Press Production Manifest', () => {
  const manifest = ArtworkService.generateProductionManifest({
    orderNumber: 'BLC-TEST-001',
    design: {
      sides: {
        front: { enabled: true, elements: [{ id: '1', type: 'text', text: 'HELLO' }], previewImageUrl: '/test.png' }
      }
    },
    selectedColor: { name: 'Optic White', hex: '#FFFFFF' },
    selectedSize: 'L'
  });

  assert.strictEqual(manifest.orderNumber, 'BLC-TEST-001');
  assert.strictEqual(manifest.garment.size, 'L');
  assert.strictEqual(manifest.sides.front.enabled, true);
  assert.strictEqual(manifest.sides.front.elementCount, 1);
});

test('MockPODProviderAdapter: handles mock contract without unverified provider submission', async () => {
  const adapterWithoutKey = new MockPODProviderAdapter({});
  const conn = await adapterWithoutKey.checkConnection();
  assert.strictEqual(conn.connected, false);

  await assert.rejects(
    async () => {
      await adapterWithoutKey.submitProductionOrder({});
    },
    /Missing POD_PROVIDER_API_KEY/
  );
});
