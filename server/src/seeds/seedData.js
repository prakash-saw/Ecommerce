const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

const seedDatabase = async () => {
  try {
    // 1. Seed Admin (configurable via environment variables)
    const adminEmail = process.env.ADMIN_EMAIL || (process.env.NODE_ENV !== 'production' ? 'admin@blancatelier.com' : null);
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'admin123' : null);

    let adminUser = null;
    if (adminEmail && adminPassword) {
      adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);
        adminUser = new User({
          name: 'Atelier Director',
          email: adminEmail,
          passwordHash: hash,
          role: 'admin',
          isEmailVerified: true
        });
        await adminUser.save();
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Seeded dev admin account: ${adminEmail}`);
        } else {
          console.log('Initialized production admin account from environment.');
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.log('Admin provisioning: Set ADMIN_EMAIL and ADMIN_PASSWORD in environment to create initial admin.');
    }

    // 2. Check if products already exist
    const count = await Product.countDocuments();
    if (count === 0) {

    // 3. Products Catalogue
    const productsData = [
      {
        name: 'The Custom Heavyweight Blank Tee',
        slug: 'custom-heavyweight-blank-tee',
        description: 'Engineered specifically for custom high-density DTG and screen printing. Crafted from 240 GSM pure combed cotton with a structured drop-shoulder drape and tight ribbed collar that retains shape wash after wash.',
        shortDescription: '240 GSM French Terry Cotton. The ultimate foundation for your custom graphics.',
        basePricePaise: 69900, // ₹699
        category: 'custom_blank',
        isCustomizable: true,
        featured: true,
        fabric: {
          gsm: 240,
          material: '100% Combed Compact Cotton',
          fit: 'Relaxed Boxy / Drop Shoulder',
          finish: 'Bio-Washed Pre-Shrunk Single Jersey',
          care: ['Machine wash cold inside out', 'Do not iron directly on print', 'Dry flat in shade']
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80', alt: 'Front Optic White T-shirt', isPrimary: true, view: 'front' },
          { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80', alt: 'Back View T-shirt', isPrimary: false, view: 'back' },
          { url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80', alt: 'Fabric Detail Closeup', isPrimary: false, view: 'detail' }
        ],
        printableArea: {
          frontEnabled: true,
          backEnabled: true,
          widthInches: 12.0,
          heightInches: 16.0,
          topPercent: 24,
          leftPercent: 28,
          widthPercent: 44,
          heightPercent: 54
        }
      },
      {
        name: 'Typography 01 // "ESSENCE" Heavyweight Tee',
        slug: 'essence-typography-tee',
        description: 'Understated Swiss typography paired with archival coordinates on optic white jersey. Screen printed with soft-hand eco inks that integrate directly into the cotton fibers without heavy plastic sheen.',
        shortDescription: 'Minimalist editorial graphic tee in 240 GSM combed cotton.',
        basePricePaise: 99900, // ₹999
        category: 'ready_to_wear',
        isCustomizable: true,
        featured: true,
        fabric: {
          gsm: 240,
          material: '100% Organic Cotton',
          fit: 'Boxy Silhouette',
          finish: 'Silicon Softener Washed',
          care: ['Cold wash only', 'Iron inside out', 'Line dry']
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80', alt: 'Essence Graphic Front', isPrimary: true, view: 'front' },
          { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80', alt: 'Back view', isPrimary: false, view: 'back' }
        ]
      },
      {
        name: 'Bauhaus Geometry // "FORM FOLLOWS" Tee',
        slug: 'bauhaus-form-follows-tee',
        description: 'Architectural minimalism celebrating modernist design principles. Features precise micro-line geometry printed with pigment discharge technique for zero ink hand-feel.',
        shortDescription: 'Constructivist geometric graphic on warm off-white heavyweight cotton.',
        basePricePaise: 109900, // ₹1,099
        category: 'ready_to_wear',
        isCustomizable: true,
        featured: true,
        fabric: {
          gsm: 250,
          material: '100% Cotton Heavy Jersey',
          fit: 'Oversized Streetwear Cut',
          finish: 'Bio-Washed',
          care: ['Gentle cycle', 'Do not bleach', 'Do not tumble dry']
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80', alt: 'Bauhaus Tee Front', isPrimary: true, view: 'front' }
        ]
      },
      {
        name: 'The Monolith // Subtle Chest Monogram Tee',
        slug: 'monolith-monogram-tee',
        description: 'For those who prefer restraint. A singular 1-inch tonal emblem placed centrally below the collarbone. Clean, timeless, effortlessly elevated.',
        shortDescription: 'Subtle tonal embroidered monogram on pristine white cotton.',
        basePricePaise: 89900, // ₹899
        category: 'ready_to_wear',
        isCustomizable: true,
        featured: false,
        fabric: {
          gsm: 240,
          material: '100% Combed Cotton',
          fit: 'Classic Relaxed',
          finish: 'Pre-shrunk',
          care: ['Machine wash cold', 'Warm iron if needed']
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80', alt: 'Monolith Front', isPrimary: true, view: 'front' }
        ]
      },
      {
        name: 'Archival Tokyo // Minimal Kanji Drop',
        slug: 'archival-tokyo-kanji-tee',
        description: 'Inspired by Japanese editorial layout and Ginza typography. High-density pigment print on back shoulder blade with clean pocket print on front.',
        shortDescription: 'Front chest and back shoulder dual-location graphic print.',
        basePricePaise: 119900, // ₹1,199
        category: 'ready_to_wear',
        isCustomizable: true,
        featured: true,
        fabric: {
          gsm: 260,
          material: '100% Supima Cotton',
          fit: 'Drop Shoulder Boxy',
          finish: 'Carbon-Brushed Ultra-Soft',
          care: ['Wash cold inside out', 'Flat air dry']
        },
        images: [
          { url: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1200&q=80', alt: 'Tokyo Archival Front', isPrimary: true, view: 'front' }
        ]
      }
    ];

    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const colors = [
      { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
      { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE' },
      { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626' }
    ];

    for (const pData of productsData) {
      const product = new Product(pData);
      await product.save();

      // Create variants for all sizes and primary colors
      for (const col of colors) {
        for (const sz of sizes) {
          const sku = `${product.slug.substring(0, 4).toUpperCase()}-${col.id.toUpperCase()}-${sz}`;
          const variant = new ProductVariant({
            productId: product._id,
            sku,
            size: sz,
            color: col,
            stockQuantity: 30,
            isActive: true
          });
          await variant.save();
        }
      }
    }
  }

    // Ensure all products have sizeChart measurements
    const allProducts = await Product.find();
    for (const prod of allProducts) {
      if (!prod.sizeChart || prod.sizeChart.length === 0) {
        prod.sizeChart = [
          { size: 'S', chestCm: 102, lengthCm: 69, shoulderCm: 48, sleeveCm: 21 },
          { size: 'M', chestCm: 108, lengthCm: 71, shoulderCm: 50, sleeveCm: 22 },
          { size: 'L', chestCm: 114, lengthCm: 74, shoulderCm: 52, sleeveCm: 23 },
          { size: 'XL', chestCm: 120, lengthCm: 76, shoulderCm: 55, sleeveCm: 24 },
          { size: 'XXL', chestCm: 126, lengthCm: 78, shoulderCm: 58, sleeveCm: 25 }
        ];
        await prod.save();
      }
    }

    // Seed Drops if none exist
    const Drop = require('../models/Drop');
    const dropCount = await Drop.countDocuments();
    if (dropCount === 0 && allProducts.length > 0) {
      const liveLaunch = new Date();
      liveLaunch.setHours(liveLaunch.getHours() - 2); // Launched 2 hours ago

      const upcomingLaunch = new Date();
      upcomingLaunch.setDate(upcomingLaunch.getDate() + 3); // Launches in 3 days

      await Drop.create([
        {
          title: 'DROP 01 // NOIR EXPERIMENTAL',
          slug: 'drop-01-noir-experimental',
          tagline: 'Limited run of 50 individually numbered 260 GSM Supima silhouettes.',
          description: 'A monolithic exploration of ultra-heavyweight Japanese combed cotton. Hand-cut boxy proportions with deep ribbed neckline and high-density screenprint finish.',
          bannerImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80',
          launchAt: liveLaunch,
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isPublished: true,
          products: [
            {
              product: allProducts[0]._id,
              dropPricePaise: 119900,
              dropStockLimit: 50,
              soldCount: 38
            }
          ]
        },
        {
          title: 'DROP 02 // ARCHIVAL DISTORTION',
          slug: 'drop-02-archival-distortion',
          tagline: 'Upcoming curated series. Ultra-clean typography meets raw DTG prints.',
          description: 'Constructed from bio-washed 240 GSM organic single jersey. Features micro-distressed typography on chest and high-contrast typographic back-print.',
          bannerImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
          launchAt: upcomingLaunch,
          endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          isPublished: true,
          products: [
            {
              product: allProducts[1]?._id || allProducts[0]._id,
              dropPricePaise: 129900,
              dropStockLimit: 75,
              soldCount: 0
            }
          ]
        }
      ]);
      console.log('Seeded initial Live & Upcoming drops!');
    }

    // Seed Reviews if none exist
    const Review = require('../models/Review');
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0 && allProducts.length > 0 && adminUser) {
      await Review.create([
        {
          userId: adminUser._id,
          productId: allProducts[0]._id,
          customerName: 'Aarav M.',
          rating: 5,
          title: 'Exceptional 240 GSM weight and drop shoulder fit',
          comment: 'The collar does not bacon after washing, and the 240 GSM weight gives that structured streetwear boxy drape I have been searching for. Highly recommended for layering.',
          photos: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
          isVerifiedPurchase: true,
          isHidden: false
        },
        {
          userId: adminUser._id,
          productId: allProducts[1]?._id || allProducts[0]._id,
          customerName: 'Rhea S.',
          rating: 5,
          title: 'Clean typography and buttery soft combed cotton',
          comment: 'Ordered size M based on the chest measurements. Sits perfectly relaxed. The print quality is crisp and razor-sharp with no plastic feel.',
          photos: [],
          isVerifiedPurchase: true,
          isHidden: false
        }
      ]);
      console.log('Seeded initial verified customer reviews!');
    }

    // Seed initial coupons if none exist
    const Coupon = require('../models/Coupon');
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.create([
        {
          code: 'WELCOME10',
          description: '10% off on your first atelier order',
          discountType: 'percentage',
          discountValue: 10,
          minOrderValuePaise: 0,
          maxDiscountPaise: 50000,
          firstOrderOnly: true,
          status: 'active'
        },
        {
          code: 'GENZ20',
          description: '20% off on premium orders over ₹1,200',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValuePaise: 120000,
          maxDiscountPaise: 60000,
          status: 'active'
        },
        {
          code: 'COLLEGEFEST25',
          description: 'Festive student promo code',
          discountType: 'percentage',
          discountValue: 25,
          minOrderValuePaise: 150000,
          maxDiscountPaise: 75000,
          status: 'active'
        }
      ]);
      console.log('Seeded initial promotional coupons!');
    }

    // Seed initial collections if none exist
    const Collection = require('../models/Collection');
    const collectionCount = await Collection.countDocuments();
    if (collectionCount === 0 && allProducts.length > 0) {
      await Collection.create([
        {
          name: 'Heavyweight Boxy Essentials',
          slug: 'heavyweight-boxy-essentials',
          description: 'Architectural streetwear foundations engineered from 240 GSM organic cotton.',
          bannerImage: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1200&q=80',
          featuredOnHome: true,
          products: allProducts.map(p => p._id),
          status: 'published'
        },
        {
          name: 'Graphic Typography Series',
          slug: 'graphic-typography-series',
          description: 'Minimalist philosophical quotes and architectural blueprint graphics.',
          bannerImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
          featuredOnHome: true,
          products: allProducts.slice(1).map(p => p._id),
          status: 'published'
        }
      ]);
      console.log('Seeded initial curated collections!');
    }

    // Seed initial support inquiries if none exist
    const SupportTicket = require('../models/SupportTicket');
    const ticketCount = await SupportTicket.countDocuments();
    if (ticketCount === 0) {
      await SupportTicket.create([
        {
          ticketNumber: 'SUP-00101',
          customerName: 'Aarav Mehta',
          customerEmail: 'aarav@college.in',
          customerPhone: '+91 98765 11223',
          category: 'sizing',
          subject: 'Sizing recommendation for 6ft lean build',
          message: 'Hi Blanc team, I usually wear size L in standard tees. Does the 240 GSM boxy cut run oversized so M would drape better?',
          status: 'open',
          priority: 'normal'
        },
        {
          ticketNumber: 'SUP-00102',
          customerName: 'Ananya Verma',
          customerEmail: 'ananya@delhi.ac.in',
          category: 'pod_customization',
          subject: 'Artwork vector resolution verification',
          message: 'I designed a vector emblem in Illustrator. Is SVG vector or 300 DPI transparent PNG preferred for the DTG print bed?',
          status: 'in_progress',
          priority: 'high',
          assignedAdminEmail: 'admin@blancatelier.com'
        }
      ]);
      console.log('Seeded initial customer support tickets!');
    }

    // Seed initial store settings if none exist
    const StoreSettings = require('../models/StoreSettings');
    const settingsCount = await StoreSettings.countDocuments();
    if (settingsCount === 0) {
      await StoreSettings.create({
        storeName: 'BLANC ATELIER',
        tagline: 'Architectural Minimalist Streetwear & Studio POD',
        contactEmail: 'concierge@blancatelier.com',
        whatsappNumber: '+91 98765 43210',
        currency: 'INR',
        lowStockThreshold: 10,
        freeShippingThresholdPaise: 99900,
        announcementText: 'Complimentary standard shipping on all orders over ₹999 across India.',
        announcementActive: true,
        returnWindowDays: 7
      });
      console.log('Seeded initial store settings!');
    }

    console.log(`Successfully verified and seeded catalogue, drops, coupons, support, and reviews!`);
  } catch (err) {
    console.error('Database seeding error:', err.message);
  }
};

module.exports = seedDatabase;
