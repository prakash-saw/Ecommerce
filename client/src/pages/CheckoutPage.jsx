import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Banknote, CreditCard, RefreshCw, ShoppingBag, Plus, Check, Star, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatPrice } from '../api/client';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get('retry');

  const { cart, items, fetchCart, applyCoupon } = useCart();
  const { user, loading: authLoading, getAddresses, setDefaultAddress } = useAuth();

  // Authentication Required Guard: Guests cannot checkout directly
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/account?mode=login&redirect=/checkout&notice=auth_required', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Saved Addresses & Selection State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddressToBook, setSaveAddressToBook] = useState(true);
  const [makeDefault, setMakeDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
    country: 'IN',
    label: 'Home',
    deliveryInstructions: ''
  });

  // Fetch saved addresses from backend (Default address always returned first)
  useEffect(() => {
    if (user && getAddresses) {
      getAddresses()
        .then((addrs) => {
          if (Array.isArray(addrs) && addrs.length > 0) {
            setSavedAddresses(addrs);
            // Default address is first in the list
            const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(defaultAddr._id);
            setAddress({
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              addressLine1: defaultAddr.addressLine1,
              addressLine2: defaultAddr.addressLine2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              postalCode: defaultAddr.postalCode,
              country: defaultAddr.country || 'IN',
              label: defaultAddr.label || 'Home',
              deliveryInstructions: defaultAddr.deliveryInstructions || ''
            });
          } else {
            setSavedAddresses([]);
            setSelectedAddressId('new');
            setAddress((prev) => ({
              ...prev,
              fullName: user.name || '',
              phone: user.phone || ''
            }));
          }
        })
        .catch((err) => console.error('Error fetching addresses:', err))
        .finally(() => setAddressLoading(false));
    }
  }, [user, getAddresses]);

  // Selected Payment Method: 'COD' | 'PREPAID'
  const [paymentMethod, setPaymentMethod] = useState('PREPAID');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Failed / Retry payment state
  const [failedOrder, setFailedOrder] = useState(null);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'verifying' | 'failed'

  // If retrying an existing pending order
  useEffect(() => {
    if (retryOrderId) {
      apiRequest(`/orders/${retryOrderId}`)
        .then((res) => {
          if (res.success && res.order) {
            if (res.order.orderStatus === 'CONFIRMED' && res.order.paymentStatus === 'PAID') {
              navigate(`/order-confirmation/${res.order._id}`);
            } else {
              setFailedOrder(res.order);
              setPaymentState('failed');
            }
          }
        })
        .catch((err) => console.error('Failed to load retry order:', err));
    }
  }, [retryOrderId, navigate]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    try {
      setCouponLoading(true);
      setCouponFeedback('');
      const res = await applyCoupon(couponInput.trim());
      setCouponFeedback(res.message || 'Coupon applied successfully!');
    } catch (err) {
      setCouponFeedback(err.message || 'Invalid coupon or referral code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePhoneSync = (val) => {
    setCustomer(c => ({ ...c, phone: val }));
    setAddress(a => ({ ...a, phone: val }));
  };

  const handleNameSync = (val) => {
    setCustomer(c => ({ ...c, name: val }));
    setAddress(a => ({ ...a, fullName: val }));
  };

  // Launch Razorpay popup and handle strict server-side verification
  const launchRazorpayModal = (order, payment) => {
    if (!window.Razorpay) {
      setErrorMessage('Razorpay payment gateway script could not be loaded. Please check your internet connection or choose Cash on Delivery.');
      setFailedOrder(order);
      setPaymentState('failed');
      setIsSubmitting(false);
      return;
    }

    const options = {
      key: payment.keyId,
      amount: payment.amountPaise,
      currency: 'INR',
      name: 'BLANC ATELIER',
      description: `Order #${order.orderNumber}`,
      order_id: payment.razorpayOrderId,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      },
      theme: {
        color: '#111111'
      },
      modal: {
        ondismiss: async function () {
          setIsSubmitting(false);
          setPaymentState('failed');
          setFailedOrder(order);
          setErrorMessage('Payment was cancelled or closed. Your order has not been confirmed.');
          try {
            await apiRequest('/payment/failure', {
              method: 'POST',
              body: JSON.stringify({
                orderId: order.id || order._id,
                razorpayOrderId: payment.razorpayOrderId,
                failureReason: 'Payment modal dismissed by user'
              })
            });
          } catch (e) {
            console.warn('Record failure error:', e);
          }
        }
      },
      handler: async function (response) {
        try {
          setPaymentState('verifying');
          // Only server-verified evidence confirms the order
          const verifyRes = await apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
              orderId: order.id || order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });

          if (verifyRes.success) {
            await fetchCart();
            navigate(`/order-confirmation/${order.id || order._id}`);
          } else {
            throw new Error(verifyRes.message || 'Signature verification failed.');
          }
        } catch (verErr) {
          console.error('Payment verification failed:', verErr);
          setPaymentState('failed');
          setFailedOrder(order);
          setErrorMessage(`Payment verification failed: ${verErr.message}. Your order has not been confirmed.`);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (failResponse) {
        console.error('Payment failed response:', failResponse);
        setPaymentState('failed');
        setFailedOrder(order);
        setErrorMessage(failResponse.error?.description || 'Payment was unsuccessful. Your order has not been confirmed.');
        try {
          await apiRequest('/payment/failure', {
            method: 'POST',
            body: JSON.stringify({
              orderId: order.id || order._id,
              razorpayOrderId: payment.razorpayOrderId,
              failureReason: failResponse.error?.description || 'Payment declined by bank'
            })
          });
        } catch (e) {
          console.warn('Record failure error:', e);
        }
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (rzpOpenErr) {
      console.error('Failed to initialize Razorpay checkout:', rzpOpenErr);
      setErrorMessage(`Payment gateway initialization failed: ${rzpOpenErr.message}`);
      setFailedOrder(order);
      setPaymentState('failed');
      setIsSubmitting(false);
    }
  };

  // Retry payment action for failed/pending order
  const handleRetryPayment = async () => {
    if (!failedOrder) return;
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const retryRes = await apiRequest(`/orders/${failedOrder.id || failedOrder._id}/retry-payment`, {
        method: 'POST'
      });

      if (!retryRes.success) {
        throw new Error(retryRes.message || 'Could not retry payment.');
      }

      launchRazorpayModal(retryRes.order, retryRes.payment);
    } catch (err) {
      setErrorMessage(err.message || 'Could not retry payment.');
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
      setErrorMessage('Please provide customer name, email and 10-digit mobile number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/[\s-]/g, ''))) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!/^\d{6}$/.test(address.postalCode.trim())) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      setIsSubmitting(true);

      const appliedCode = cart?.appliedCoupon?.code || couponInput.trim() || undefined;
      const refCode = (couponInput.trim().toUpperCase().startsWith('BLANC-'))
        ? couponInput.trim().toUpperCase()
        : undefined;

      // 1. Create order on backend (authoritative validation & pricing)
      const res = await apiRequest('/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          customer,
          shippingAddress: {
            ...address,
            isDefault: selectedAddressId === 'new' ? makeDefault : false
          },
          saveAddress: selectedAddressId === 'new' ? saveAddressToBook : false,
          couponCode: appliedCode,
          referralCode: refCode,
          paymentMethod
        })
      });

      if (!res.success) {
        throw new Error(res.message || 'Could not create order.');
      }

      // 2. COD Flow -> Order confirmed immediately by server
      if (paymentMethod === 'COD') {
        await fetchCart();
        navigate(`/order-confirmation/${res.order.id || res.order._id}`);
        return;
      }

      // 3. Prepaid Flow -> Launch Razorpay gateway modal
      launchRazorpayModal(res.order, res.payment);
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during checkout.');
      setIsSubmitting(false);
    }
  };

  // Payment Verification Pending screen
  if (paymentState === 'verifying') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-neutral-300 border-t-black rounded-full animate-spin mx-auto" />
        <h2 className="font-editorial text-3xl font-semibold">Verifying Payment With Gateway...</h2>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Please wait while our server securely verifies the transaction signature. Do not refresh or close this page.
        </p>
      </div>
    );
  }

  // Payment Failed / Retry screen
  if (paymentState === 'failed' && failedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-sm text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-red-600 font-bold block">
            Payment Unsuccessful
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-neutral-900">
            Your Order Has Not Been Confirmed
          </h2>
          <p className="text-xs text-red-800 max-w-md mx-auto">
            {errorMessage || 'The payment was not completed, cancelled, or the transaction signature could not be verified by our servers.'}
          </p>
          <div className="font-mono text-xs bg-white py-2 px-3 rounded inline-block border border-red-200 text-neutral-700 mt-2">
            Pending Order Reference: <strong>{failedOrder.orderNumber}</strong>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E0] p-6 rounded-sm space-y-4">
          <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900">What would you like to do?</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your cart and chosen customizations have been saved. You can retry paying with a different card, UPI app, or net banking account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRetryPayment}
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Opening Gateway...' : 'Retry Payment'}</span>
            </button>
            <button
              onClick={() => {
                setPaymentState('idle');
                setFailedOrder(null);
                setErrorMessage('');
              }}
              className="px-6 py-3.5 border border-neutral-300 text-neutral-800 hover:border-black uppercase text-xs tracking-widest font-semibold rounded text-center"
            >
              Change Payment Method / Details
            </button>
            <Link
              to="/shop"
              className="px-6 py-3.5 border border-neutral-200 text-neutral-500 hover:text-black uppercase text-xs tracking-widest font-semibold rounded text-center flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Return to Shop</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-editorial text-3xl">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-neutral-500">Add ready-to-wear or custom POD tees before proceeding.</p>
        <Link to="/shop" className="inline-block mt-4 px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold rounded">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Checkout Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">Checkout</span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 mt-1">
              Delivery & Payment
            </h1>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* 1. Customer Details */}
            <div className="space-y-4 bg-white p-6 border border-neutral-200 rounded-sm">
              <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900">
                1. Customer Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-600 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => handleNameSync(e.target.value)}
                    placeholder="e.g. Aryan Sharma"
                    className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-medium">Email Address (for order receipts & OTP) *</label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="name@domain.com"
                    className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-neutral-600 mb-1 font-medium">10-Digit Mobile Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-600 text-xs rounded-l font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      value={customer.phone}
                      onChange={(e) => handlePhoneSync(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full p-2.5 border border-neutral-300 rounded-r focus:border-black focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Destination & Address Book Integration */}
            <div className="space-y-4 bg-white p-6 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div>
                  <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900">
                    2. Delivery Destination
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Select a verified destination or add a new delivery location.
                  </p>
                </div>
                {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId('new');
                      setAddress({
                        fullName: customer.name || '',
                        phone: customer.phone || '',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: 'Karnataka',
                        postalCode: '',
                        country: 'IN',
                        label: 'Home',
                        deliveryInstructions: ''
                      });
                    }}
                    className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deliver to New Address</span>
                  </button>
                )}
              </div>

              {addressLoading ? (
                <div className="py-6 text-center text-xs text-neutral-500 animate-pulse">
                  Loading saved address book...
                </div>
              ) : savedAddresses.length > 0 && selectedAddressId !== 'new' ? (
                <div className="space-y-3">
                  {/* Saved Address Cards (Backend returns default first) */}
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    const isDefault = !!addr.isDefault;

                    return (
                      <div
                        key={addr._id}
                        onClick={() => {
                          setSelectedAddressId(addr._id);
                          setAddress({
                            fullName: addr.fullName,
                            phone: addr.phone,
                            addressLine1: addr.addressLine1,
                            addressLine2: addr.addressLine2 || '',
                            city: addr.city,
                            state: addr.state,
                            postalCode: addr.postalCode,
                            country: addr.country || 'IN',
                            label: addr.label || 'Home',
                            deliveryInstructions: addr.deliveryInstructions || ''
                          });
                        }}
                        className={`p-4 border rounded-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-black bg-neutral-50 ring-1 ring-black shadow-sm'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="checkoutAddress"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 text-black focus:ring-black"
                            />
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-neutral-900">{addr.fullName}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                  addr.label === 'Work'
                                    ? 'bg-blue-100 text-blue-800'
                                    : addr.label === 'Other'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-neutral-100 text-neutral-700'
                                }`}>
                                  {addr.label || 'Home'}
                                </span>
                                {isDefault && (
                                  <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>Default Address</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-neutral-500 font-mono block text-[11px]">+91 {addr.phone}</span>
                              <p className="text-neutral-700 leading-relaxed pt-0.5">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                                {addr.city}, {addr.state} — <strong className="font-mono text-black">{addr.postalCode}</strong>
                              </p>
                              {addr.deliveryInstructions && (
                                <p className="text-[11px] text-neutral-500 italic mt-1">
                                  Instructions: {addr.deliveryInstructions}
                                </p>
                              )}
                            </div>
                          </div>

                          {!isDefault && isSelected && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await setDefaultAddress(addr._id);
                                  if (res.success && res.addresses) {
                                    setSavedAddresses(res.addresses);
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="text-[11px] text-neutral-600 hover:text-black underline font-medium"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId('new');
                      setAddress({
                        fullName: customer.name || '',
                        phone: customer.phone || '',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: 'Karnataka',
                        postalCode: '',
                        country: 'IN',
                        label: 'Home',
                        deliveryInstructions: ''
                      });
                    }}
                    className="w-full py-3 border border-dashed border-neutral-300 hover:border-black rounded text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Delivery Destination</span>
                  </button>
                </div>
              ) : (
                /* NEW ADDRESS ENTRY FORM */
                <div className="space-y-4 text-xs">
                  {savedAddresses.length > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                      <span className="font-semibold text-neutral-800">Entering New Delivery Address</span>
                      <button
                        type="button"
                        onClick={() => {
                          const def = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                          setSelectedAddressId(def._id);
                          setAddress({
                            fullName: def.fullName,
                            phone: def.phone,
                            addressLine1: def.addressLine1,
                            addressLine2: def.addressLine2 || '',
                            city: def.city,
                            state: def.state,
                            postalCode: def.postalCode,
                            country: def.country || 'IN',
                            label: def.label || 'Home',
                            deliveryInstructions: def.deliveryInstructions || ''
                          });
                        }}
                        className="text-neutral-600 hover:text-black underline font-medium"
                      >
                        Choose from saved addresses ({savedAddresses.length})
                      </button>
                    </div>
                  )}

                  {/* Address Label buttons */}
                  <div>
                    <label className="block text-neutral-600 mb-1.5 font-medium">Address Label</label>
                    <div className="flex gap-2">
                      {['Home', 'Work', 'Other'].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddress({ ...address, label: lbl })}
                          className={`px-3 py-1.5 text-xs rounded font-medium border transition-colors ${
                            address.label === lbl
                              ? 'bg-black text-white border-black shadow-sm'
                              : 'border-neutral-300 text-neutral-700 hover:border-black'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        placeholder="e.g. Aryan Sharma"
                        className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">10-Digit Mobile *</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-600 text-xs rounded-l font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength="10"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                          placeholder="9876543210"
                          className="w-full p-2.5 border border-neutral-300 rounded-r focus:border-black focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Street Address / House / Flat *</label>
                    <input
                      type="text"
                      required
                      value={address.addressLine1}
                      onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                      placeholder="Flat 402, Oakwood Residency, 12th Main Road"
                      className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Apartment, Landmark, Suite (Optional)</label>
                    <input
                      type="text"
                      value={address.addressLine2}
                      onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                      placeholder="Near Metro Station"
                      className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">City / District *</label>
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="e.g. Bengaluru"
                        className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">State *</label>
                      <select
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded bg-white focus:outline-none"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">PIN Code (6 digits) *</label>
                      <input
                        type="text"
                        required
                        maxLength="6"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value.replace(/\D/g, '') })}
                        placeholder="560038"
                        className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      value={address.deliveryInstructions}
                      onChange={(e) => setAddress({ ...address, deliveryInstructions: e.target.value })}
                      placeholder="e.g. Leave with security / Call upon arrival"
                      className="w-full p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                    />
                  </div>

                  {/* Save to Account Checkbox */}
                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded space-y-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-neutral-900">
                      <input
                        type="checkbox"
                        checked={saveAddressToBook}
                        onChange={(e) => setSaveAddressToBook(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black"
                      />
                      <span>Save this address to my account</span>
                    </label>
                    <p className="text-[11px] text-neutral-500 leading-relaxed pl-5">
                      This address will be saved in your Blanc Atelier address book for seamless one-click selection on future orders.
                    </p>

                    {saveAddressToBook && (
                      <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] text-neutral-700 pl-5 pt-1">
                        <input
                          type="checkbox"
                          checked={makeDefault}
                          onChange={(e) => setMakeDefault(e.target.checked)}
                          className="rounded border-neutral-300 text-black focus:ring-black"
                        />
                        <span>Set as my primary default delivery address</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment Method Selection (COD vs Prepaid) */}
            <div className="space-y-4 bg-white p-6 border border-neutral-200 rounded-sm">
              <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900">
                3. Choose Payment Method
              </h2>

              <div className="space-y-3">
                {/* Option A: Cash on Delivery */}
                <label
                  className={`flex items-start gap-3.5 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-black bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-0.5 text-black focus:ring-black accent-black"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-neutral-900">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-neutral-700" />
                        <span>Cash on Delivery (COD)</span>
                      </span>
                      <span className="font-mono text-[11px] bg-neutral-200 px-2 py-0.5 rounded text-neutral-800">
                        Pay upon arrival
                      </span>
                    </div>
                    <p className="text-neutral-500 mt-1 leading-relaxed">
                      Pay with cash or UPI directly to the courier agent when your package is delivered to your doorstep.
                    </p>
                    {paymentMethod === 'COD' && (
                      <div className="mt-2 text-[11px] font-mono text-neutral-900 bg-white p-2 border border-neutral-200 rounded">
                        Amount Due at Doorstep: <strong>{formatPrice(cart?.totalAmountPaise)}</strong>
                      </div>
                    )}
                  </div>
                </label>

                {/* Option B: Prepaid Online Payment */}
                <label
                  className={`flex items-start gap-3.5 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'PREPAID'
                      ? 'border-black bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PREPAID"
                    checked={paymentMethod === 'PREPAID'}
                    onChange={() => setPaymentMethod('PREPAID')}
                    className="mt-0.5 text-black focus:ring-black accent-black"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-neutral-900">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Online Prepaid Payment (UPI, Cards, NetBanking)</span>
                      </span>
                      <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Instant Confirmation
                      </span>
                    </div>
                    <p className="text-neutral-500 mt-1 leading-relaxed">
                      100% secure payment via Razorpay. Supports Google Pay, PhonePe, Paytm, all major credit/debit cards, and 50+ net banking institutions.
                    </p>
                    {paymentMethod === 'PREPAID' && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/70 p-2 border border-emerald-200 rounded">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Verified by 256-bit server cryptographic signature check.</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors uppercase text-xs tracking-widest font-bold flex items-center justify-center gap-2 rounded shadow"
            >
              <span>
                {isSubmitting
                  ? 'Processing Order...'
                  : paymentMethod === 'COD'
                  ? `Place COD Order (${formatPrice(cart?.totalAmountPaise)})`
                  : `Pay ${formatPrice(cart?.totalAmountPaise)} Online`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E0] p-6 rounded-sm space-y-6">
          <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 pb-3 border-b border-[#E5E5E0]">
            Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.itemId} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-b-0">
                <div className="w-16 h-20 bg-neutral-100 flex-shrink-0 border border-neutral-200 rounded overflow-hidden">
                  <img
                    src={item.previewImageUrl}
                    alt={item.productName}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex justify-between font-semibold text-neutral-900">
                    <span>{item.productName}</span>
                    <span className="font-mono">{formatPrice(item.lineTotalPaise)}</span>
                  </div>
                  <div className="text-neutral-500 mt-1 flex gap-2">
                    <span>Size: {item.selectedSize}</span>
                    <span>•</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                  {item.isCustom && (
                    <span className="inline-block mt-1 text-[10px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-mono">
                      Custom POD ({item.printLocations?.join(' + ')})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon / Referral Voucher Input */}
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">
              Have a Promo, Referral, or Reward Voucher?
            </span>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WELCOME10, BLANC-XXXX"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 border rounded text-xs font-mono uppercase border-neutral-300 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="px-3 py-1.5 bg-black text-white text-xs font-mono uppercase font-semibold rounded hover:bg-neutral-800 disabled:opacity-50"
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            </form>
            {couponFeedback && (
              <p className="text-[11px] font-mono text-emerald-700">✦ {couponFeedback}</p>
            )}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2 pt-4 border-t border-[#E5E5E0] text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-mono text-neutral-900">{formatPrice(cart?.subtotalPaise)}</span>
            </div>
            {cart?.printingFeePaise > 0 && (
              <div className="flex justify-between">
                <span>Print-on-Demand Charges</span>
                <span className="font-mono text-neutral-900">{formatPrice(cart?.printingFeePaise)}</span>
              </div>
            )}
            {cart?.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon ({cart?.appliedCoupon?.code})</span>
                <span className="font-mono">-{formatPrice(cart.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono text-neutral-900">
                {cart?.shippingFeePaise === 0 ? 'COMPLIMENTARY' : formatPrice(cart?.shippingFeePaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Apparel GST (5%)</span>
              <span className="font-mono text-neutral-900">{formatPrice(cart?.taxPaise)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-neutral-300">
              <span className="font-editorial">Grand Total</span>
              <span className="font-mono">{formatPrice(cart?.totalAmountPaise)}</span>
            </div>
            <div className="pt-2 text-[11px] text-neutral-500 font-mono">
              Payment Method: <strong>{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Online (Razorpay)'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
