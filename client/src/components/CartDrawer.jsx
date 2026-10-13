import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, items, updateQuantity, removeItem, applyCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const subtotal = cart?.subtotalPaise || 0;
  const freeShippingThreshold = 149900; // ₹1,499
  const remainingForFreeShip = Math.max(0, freeShippingThreshold - subtotal);
  const freeShipPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await applyCoupon(couponCode.trim());
      setCouponMsg(res.message);
    } catch (err) {
      setCouponMsg(err.message);
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAFAF8] shadow-2xl flex flex-col border-l border-[#E5E5E0]">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E5E5E0] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-editorial font-medium tracking-tight">Your Bag</h2>
              <p className="text-xs text-neutral-500 font-sans tracking-wider uppercase">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-neutral-400 hover:text-black transition-colors rounded-full"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress bar */}
          <div className="bg-[#F0EFEA] px-5 py-3 border-b border-[#E5E5E0] text-xs">
            {remainingForFreeShip > 0 ? (
              <p className="text-neutral-700">
                Add <span className="font-semibold text-black">{formatPrice(remainingForFreeShip)}</span> more for <span className="font-semibold text-black">Complimentary Express Shipping</span>
              </p>
            ) : (
              <p className="text-emerald-800 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> You unlocked Complimentary Express Shipping!
              </p>
            )}
            <div className="w-full bg-neutral-300 h-1 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-300"
                style={{ width: `${freeShipPercent}%` }}
              />
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-neutral-500 font-editorial text-xl italic">Your bag is currently empty.</p>
                <div className="space-y-2 pt-2">
                  <Link
                    to="/shop"
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full py-3 text-xs uppercase tracking-widest bg-black text-white hover:bg-neutral-800 transition-colors"
                  >
                    Explore Ready-to-Wear
                  </Link>
                  <Link
                    to="/customize"
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full py-3 text-xs uppercase tracking-widest border border-neutral-300 text-black hover:border-black transition-colors"
                  >
                    Open Custom POD Studio
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.itemId}
                  className="flex gap-4 pb-5 border-b border-[#E5E5E0] last:border-b-0"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-neutral-100 flex-shrink-0 border border-neutral-200 overflow-hidden relative">
                    <img
                      src={item.previewImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'}
                      alt={item.productName}
                      className="w-full h-full object-contain p-1"
                    />
                    {item.isCustom && (
                      <span className="absolute bottom-0 left-0 right-0 bg-neutral-900 text-[8px] text-white tracking-widest text-center py-0.5 uppercase">
                        Custom POD
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-editorial text-base font-semibold leading-tight text-neutral-900">
                          {item.productName}
                        </h3>
                        <button
                          onClick={() => removeItem(item.itemId)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500">
                        <span>Size: <strong className="text-black">{item.selectedSize}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: item.selectedColor?.hex || '#FFFFFF' }}
                          />
                          {item.selectedColor?.name || 'White'}
                        </span>
                      </div>

                      {item.isCustom && (
                        <div className="mt-1 text-[11px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded inline-block">
                          Print: {item.printLocations?.join(' + ') || 'Front'}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Line Total */}
                    <div className="flex items-center justify-between mt-3 pt-1">
                      <div className="flex items-center border border-neutral-300 rounded text-xs">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold text-black">
                        {formatPrice(item.lineTotalPaise)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Totals */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#E5E5E0] bg-[#FAF9F5] space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Coupon (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-white border border-neutral-300 rounded focus:outline-none focus:border-black uppercase font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs uppercase tracking-wider bg-neutral-900 text-white rounded hover:bg-black font-medium transition-colors"
                >
                  Apply
                </button>
              </form>
              {couponMsg && (
                <p className="text-[11px] text-neutral-600">{couponMsg}</p>
              )}

              {/* Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-neutral-900">{formatPrice(cart?.subtotalPaise)}</span>
                </div>
                {cart?.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({cart?.appliedCoupon?.code})</span>
                    <span className="font-mono">-{formatPrice(cart.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-mono text-neutral-900">
                    {cart?.shippingFeePaise === 0 ? 'FREE' : formatPrice(cart?.shippingFeePaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5% Apparel Tax Included)</span>
                  <span className="font-mono text-neutral-900">{formatPrice(cart?.taxPaise)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-black pt-2 border-t border-neutral-300">
                  <span className="font-editorial">Total Amount</span>
                  <span className="font-mono">{formatPrice(cart?.totalAmountPaise)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-black text-white hover:bg-neutral-800 transition-colors uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
