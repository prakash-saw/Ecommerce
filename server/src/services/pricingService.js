const { POD_PRICING } = require('../config/constants');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

/**
 * Server-side authoritative pricing engine.
 * Never accepts prices submitted by the client.
 * All monetary calculations operate in integer paise.
 */
class PricingService {
  /**
   * Calculate unit price in paise for a single item (ready-to-wear or custom POD)
   */
  static async calculateItemUnitPricePaise(item) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      throw new Error(`Product not found or currently unavailable: ${item.productId}`);
    }

    if (item.isCustom) {
      // Base custom t-shirt price
      const baseCost = product.basePricePaise || POD_PRICING.BASE_CUSTOM_TEE_PAISE;

      // Print locations cost
      const printLocations = Array.isArray(item.printLocations) ? item.printLocations : ['front'];
      let printingFee = 0;

      if (printLocations.includes('front') && printLocations.includes('back')) {
        printingFee = POD_PRICING.DOUBLE_SIDE_PRINT_PAISE; // ₹450
      } else if (printLocations.includes('front') || printLocations.includes('back')) {
        printingFee = POD_PRICING.SINGLE_SIDE_PRINT_PAISE; // ₹250
      }

      return baseCost + printingFee;
    } else {
      // Ready-to-wear product: check if variant has a price override
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId);
        if (variant && variant.priceOverridePaise) {
          return variant.priceOverridePaise;
        }
      }
      return product.basePricePaise;
    }
  }

  /**
   * Recalculates full order/cart pricing breakdown strictly on the server
   */
  static async calculateCartTotals({ items, couponCode = null }) {
    if (!items || items.length === 0) {
      return {
        subtotalPaise: 0,
        printingFeePaise: 0,
        shippingFeePaise: 0,
        discountPaise: 0,
        taxPaise: 0,
        totalAmountPaise: 0,
        appliedCoupon: null,
        verifiedItems: []
      };
    }

    let subtotalPaise = 0;
    let totalPrintingFeePaise = 0;
    const verifiedItems = [];

    for (const item of items) {
      const unitPricePaise = await this.calculateItemUnitPricePaise(item);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotalPaise = unitPricePaise * qty;

      if (item.isCustom) {
        const printLocations = item.printLocations || ['front'];
        const printCostPerUnit = (printLocations.includes('front') && printLocations.includes('back'))
          ? POD_PRICING.DOUBLE_SIDE_PRINT_PAISE
          : POD_PRICING.SINGLE_SIDE_PRINT_PAISE;
        totalPrintingFeePaise += (printCostPerUnit * qty);
      }

      subtotalPaise += lineTotalPaise;
      const rawItem = (item && typeof item.toObject === 'function') ? item.toObject() : item;
      verifiedItems.push({
        ...rawItem,
        quantity: qty,
        unitPricePaise,
        lineTotalPaise
      });
    }

    // Coupon & Referral validation
    let discountPaise = 0;
    let appliedCoupon = null;

    if (couponCode && typeof couponCode === 'string') {
      const codeUpper = couponCode.trim().toUpperCase();
      if (codeUpper === 'WELCOME10') {
        const discountPct = 10;
        discountPaise = Math.round((subtotalPaise * discountPct) / 100);
        appliedCoupon = { code: codeUpper, discountPercentage: discountPct, discountPaise };
      } else if (codeUpper === 'GENZ20' && subtotalPaise >= 120000) {
        // ₹1200 min cart
        const discountPct = 20;
        discountPaise = Math.round((subtotalPaise * discountPct) / 100);
        appliedCoupon = { code: codeUpper, discountPercentage: discountPct, discountPaise };
      } else if (codeUpper.startsWith('REW-')) {
        // Loyalty Rewards voucher
        try {
          const RewardConfig = require('../models/RewardConfig');
          const config = await RewardConfig.findOne({ 'coupons.code': codeUpper });
          if (config) {
            const coup = config.coupons.find(c => c.code === codeUpper && !c.isUsed && new Date(c.expiresAt) > new Date());
            if (coup && subtotalPaise >= (coup.minOrderValuePaise || 0)) {
              // Cap discount percentage to preserve margins
              const maxAllowedDiscount = Math.round((subtotalPaise * (config.maxRedemptionDiscountPercent || 30)) / 100);
              discountPaise = Math.min(coup.discountPaise, maxAllowedDiscount);
              appliedCoupon = { code: codeUpper, discountPaise, isRewardVoucher: true };
            }
          }
        } catch (coupErr) {
          console.warn('Reward coupon lookup error:', coupErr.message);
        }
      } else if (codeUpper.startsWith('BLANC-')) {
        // Referral Discount
        try {
          const RewardAccount = require('../models/RewardAccount');
          const RewardConfig = require('../models/RewardConfig');
          const account = await RewardAccount.findOne({ referralCode: codeUpper });
          if (account) {
            const config = await RewardConfig.findOne() || { referredDiscountPercent: 10, minOrderValuePaise: 99900 };
            if (subtotalPaise >= (config.minOrderValuePaise || 99900)) {
              const discountPct = config.referredDiscountPercent || 10;
              discountPaise = Math.round((subtotalPaise * discountPct) / 100);
              appliedCoupon = { code: codeUpper, discountPercentage: discountPct, discountPaise, isReferral: true };
            }
          }
        } catch (refErr) {
          console.warn('Referral code lookup error:', refErr.message);
        }
      } else {
        // Dynamic Admin Coupon Lookup
        try {
          const Coupon = require('../models/Coupon');
          const now = new Date();
          const couponDoc = await Coupon.findOne({
            code: codeUpper,
            status: 'active',
            startDate: { $lte: now },
            $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }]
          });

          if (couponDoc) {
            // Check usage limit
            const hasUsageLeft = couponDoc.usageLimit === null || couponDoc.usedCount < couponDoc.usageLimit;
            const meetsMinOrder = !couponDoc.minOrderValuePaise || subtotalPaise >= couponDoc.minOrderValuePaise;

            if (hasUsageLeft && meetsMinOrder) {
              if (couponDoc.discountType === 'percentage') {
                let calcDiscount = Math.round((subtotalPaise * couponDoc.discountValue) / 100);
                if (couponDoc.maxDiscountPaise && calcDiscount > couponDoc.maxDiscountPaise) {
                  calcDiscount = couponDoc.maxDiscountPaise;
                }
                discountPaise = calcDiscount;
                appliedCoupon = {
                  code: codeUpper,
                  discountPercentage: couponDoc.discountValue,
                  discountPaise,
                  couponId: couponDoc._id
                };
              } else if (couponDoc.discountType === 'fixed') {
                discountPaise = Math.min(subtotalPaise, couponDoc.discountValue);
                appliedCoupon = {
                  code: codeUpper,
                  discountPaise,
                  couponId: couponDoc._id
                };
              }
            }
          }
        } catch (coupErr) {
          console.warn('Coupon model lookup error:', coupErr.message);
        }
      }
    }

    const netSubtotal = Math.max(0, subtotalPaise - discountPaise);

    // Shipping calculation
    const shippingFeePaise = (netSubtotal >= POD_PRICING.FREE_SHIPPING_THRESHOLD_PAISE || netSubtotal === 0)
      ? 0
      : POD_PRICING.SHIPPING_FEE_PAISE;

    // GST Apparel Tax (5% included or calculated)
    const taxPaise = Math.round((netSubtotal * POD_PRICING.GST_PERCENTAGE) / 100);

    const totalAmountPaise = netSubtotal + shippingFeePaise + taxPaise;

    return {
      subtotalPaise,
      printingFeePaise: totalPrintingFeePaise,
      shippingFeePaise,
      discountPaise,
      taxPaise,
      totalAmountPaise,
      appliedCoupon,
      verifiedItems
    };
  }
}

module.exports = PricingService;
