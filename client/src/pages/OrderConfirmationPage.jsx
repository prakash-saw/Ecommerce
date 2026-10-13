import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle, Package, ArrowRight, Printer, ShieldCheck, Banknote, RefreshCw } from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = () => {
    setRefreshing(true);
    apiRequest(`/orders/${orderId}`)
      .then((res) => {
        if (res.success) setOrder(res.order);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
        <p className="font-editorial text-2xl">Retrieving Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-editorial text-3xl">Order Not Found</h2>
        <p className="text-xs text-neutral-500">We could not locate this order record.</p>
        <Link to="/" className="text-xs uppercase tracking-widest underline">Return to Atelier</Link>
      </div>
    );
  }

  const isCod = order.paymentMethod === 'COD';
  const isPrepaid = order.paymentMethod === 'PREPAID';
  const isConfirmed = order.orderStatus === 'CONFIRMED' || ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus);
  const isPendingVerification = order.orderStatus === 'PENDING_PAYMENT' && order.paymentStatus === 'PENDING';
  const isPaymentFailed = order.paymentStatus === 'FAILED' || order.orderStatus === 'CANCELLED';

  // 1. Pending Verification State (DO NOT show success!)
  if (isPendingVerification) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-sm text-center space-y-3">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-7 h-7" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-amber-700 font-bold block">
            Payment Verification In Progress
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900">
            Awaiting Gateway Confirmation
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Your payment is currently being verified by the payment gateway. Once verified, your order status will automatically update to Confirmed.
          </p>
          <div className="pt-2">
            <span className="font-mono text-xs bg-white px-3 py-1.5 rounded border border-amber-200">
              Pending Order: <strong className="text-black">{order.orderNumber}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchOrder}
            disabled={refreshing}
            className="flex-1 py-3.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded text-center"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>
          <Link
            to={`/checkout?retry=${order._id}`}
            className="flex-1 py-3.5 border border-neutral-300 text-black hover:border-black uppercase text-xs tracking-widest font-semibold rounded text-center flex items-center justify-center"
          >
            Retry Payment
          </Link>
        </div>
      </div>
    );
  }

  // 2. Failed / Cancelled State (DO NOT show success!)
  if (isPaymentFailed && !isConfirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="bg-red-50 border border-red-200 p-8 rounded-sm text-center space-y-3">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-red-700 font-bold block">
            Payment Unsuccessful
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900">
            Order Not Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            The payment for order <strong>#{order.orderNumber}</strong> could not be verified or was cancelled. Your card or UPI account has not been charged for a confirmed order.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/checkout?retry=${order._id}`}
            className="flex-1 py-3.5 bg-black text-white hover:bg-neutral-800 uppercase text-xs tracking-widest font-semibold rounded text-center flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Payment</span>
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3.5 border border-neutral-300 text-neutral-800 hover:border-black uppercase text-xs tracking-widest font-semibold rounded text-center"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // 3. CONFIRMED ORDER (COD or Prepaid Server-Verified)
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-20 space-y-8">
      {/* Banner */}
      <div className="text-center space-y-3 pb-8 border-b border-[#E5E5E0]">
        <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold block">
          {isCod ? 'Order Confirmed • Cash on Delivery' : 'Payment Verified • Order Confirmed'}
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900">
          Thank you, {order.customer?.name?.split(' ')[0]}.
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          {isCod
            ? 'Your Cash on Delivery order is confirmed and will be dispatched soon. Please keep exact cash or UPI ready at delivery.'
            : 'Your payment was successfully verified by our servers. Our atelier team is preparing your apparel.'}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="font-mono text-xs bg-neutral-100 px-3 py-1.5 rounded border border-neutral-200">
            Order Reference: <strong className="text-black">{order.orderNumber}</strong>
          </span>
          {order.payment?.razorpayPaymentId && (
            <span className="font-mono text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded border border-emerald-200">
              Payment Ref: <strong>{order.payment.razorpayPaymentId}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Payment Highlight Box for COD */}
      {isCod && (
        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-sm flex items-start gap-3.5 text-xs">
          <Banknote className="w-5 h-5 text-amber-800 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-amber-900">
              Cash on Delivery (COD) Selected
            </p>
            <p className="text-amber-800 leading-relaxed">
              Total Amount Due at Delivery:{' '}
              <strong className="text-base font-mono text-black">
                {formatPrice(order.pricing?.totalAmountPaise)}
              </strong>
            </p>
            <p className="text-[11px] text-amber-700">
              Payment Status: <strong>UNPAID</strong> (Payable to the delivery partner in cash or UPI upon handover).
            </p>
          </div>
        </div>
      )}

      {/* Prepaid Highlight Box */}
      {isPrepaid && (
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-sm flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Online Payment Status: <strong>PAID</strong> (Verified via Razorpay)</span>
          </div>
          <span className="font-mono font-bold text-neutral-900">
            {formatPrice(order.pricing?.totalAmountPaise)}
          </span>
        </div>
      )}

      {/* Order Summary & Production Details */}
      <div className="bg-white border border-[#E5E5E0] p-6 rounded-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-100 text-xs">
          <span className="font-bold uppercase tracking-wider text-neutral-900">Order Items</span>
          <span className="text-neutral-500 font-mono">
            Status: {order.orderStatus || order.fulfilmentStatus.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center">
              <div className="w-16 h-20 bg-neutral-100 border border-neutral-200 rounded overflow-hidden flex-shrink-0">
                <img src={item.previewImageUrl} alt={item.productName} className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex-1 text-xs">
                <h4 className="font-editorial text-base font-semibold text-neutral-900">{item.productName}</h4>
                <div className="text-neutral-500 mt-0.5">
                  Size: <strong>{item.selectedSize}</strong> • Colour: {item.selectedColor?.name || 'White'} • Qty: {item.quantity}
                </div>
                {item.isCustom && (
                  <span className="inline-block mt-1 text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded font-mono">
                    POD Item ({item.printLocations?.join(' + ')})
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold text-neutral-900">
                {formatPrice(item.lineTotalPaise)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="pt-4 border-t border-neutral-200 text-xs space-y-1.5 text-neutral-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-neutral-900">{formatPrice(order.pricing?.subtotalPaise)}</span>
          </div>
          {order.pricing?.printingFeePaise > 0 && (
            <div className="flex justify-between">
              <span>Print-on-Demand Fee</span>
              <span className="font-mono text-neutral-900">{formatPrice(order.pricing?.printingFeePaise)}</span>
            </div>
          )}
          {order.pricing?.discountPaise > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discount</span>
              <span className="font-mono">-{formatPrice(order.pricing?.discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-mono text-neutral-900">
              {order.pricing?.shippingFeePaise === 0 ? 'FREE' : formatPrice(order.pricing?.shippingFeePaise)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%)</span>
            <span className="font-mono text-neutral-900">{formatPrice(order.pricing?.taxPaise)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-neutral-300">
            <span className="font-editorial">{isCod ? 'Total Due upon Delivery' : 'Total Paid'}</span>
            <span className="font-mono">{formatPrice(order.pricing?.totalAmountPaise)}</span>
          </div>
        </div>

        {/* Shipping Destination */}
        <div className="pt-4 border-t border-neutral-200 text-xs">
          <span className="font-bold uppercase tracking-wider text-neutral-900 block mb-1">Delivering To</span>
          <p className="text-neutral-600 leading-relaxed">
            {order.shippingAddress?.fullName}<br />
            {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}<br />
            Phone: {order.shippingAddress?.phone}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to={`/track-order?order=${order.orderNumber}`}
          className="flex-1 py-3.5 bg-black text-white hover:bg-neutral-800 transition-colors uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded text-center"
        >
          <span>Track Production & Shipping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/shop"
          className="py-3.5 px-6 border border-neutral-300 text-black hover:border-black transition-colors uppercase text-xs tracking-widest font-semibold rounded text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
