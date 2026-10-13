import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  MapPin,
  X,
  Lock
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminOrdersTab({ initialOrderId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('');

  // Selected Order for Details Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Status Update & Tracking form state
  const [newStatus, setNewStatus] = useState('');
  const [carrier, setCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Internal Note form state
  const [internalNoteText, setInternalNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Cancel order modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 12
      });
      if (search) params.append('search', search);
      if (orderStatusFilter) params.append('orderStatus', orderStatusFilter);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);
      if (fulfilmentFilter) params.append('fulfilmentStatus', fulfilmentFilter);

      const res = await apiRequest(`/admin/orders?${params.toString()}`);
      if (res.success) {
        setOrders(res.orders || []);
        setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderId) => {
    try {
      setDrawerLoading(true);
      setOrderDrawerOpen(true);
      const res = await apiRequest(`/admin/orders/${orderId}`);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setNewStatus(res.order.fulfilmentStatus || res.order.orderStatus?.toLowerCase() || '');
        setCarrier(res.order.tracking?.carrier || 'BlueDart Express');
        setTrackingNumber(res.order.tracking?.trackingNumber || '');
        setStatusNote('');
      }
    } catch (err) {
      alert('Error fetching order details: ' + err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [orderStatusFilter, paymentFilter, methodFilter, fulfilmentFilter]);

  useEffect(() => {
    if (initialOrderId) {
      openOrderDetails(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      let orderStatusVal = 'PROCESSING';
      let fulfilmentStatusVal = newStatus;

      if (newStatus === 'shipped') {
        orderStatusVal = 'SHIPPED';
        fulfilmentStatusVal = 'shipped';
      } else if (newStatus === 'delivered') {
        orderStatusVal = 'DELIVERED';
        fulfilmentStatusVal = 'delivered';
      } else if (newStatus === 'confirmed') {
        orderStatusVal = 'CONFIRMED';
        fulfilmentStatusVal = 'approved';
      } else if (newStatus === 'processing' || newStatus === 'in_production') {
        orderStatusVal = 'PROCESSING';
        fulfilmentStatusVal = 'in_production';
      }

      const res = await apiRequest(`/admin/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          orderStatus: orderStatusVal,
          fulfilmentStatus: fulfilmentStatusVal,
          carrier,
          trackingNumber,
          note: statusNote
        })
      });

      if (res.success) {
        setSelectedOrder(res.order);
        setStatusNote('');
        fetchOrders(pagination.page);
        alert(`Order #${res.order.orderNumber} updated to ${res.order.orderStatus}!`);
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !internalNoteText.trim()) return;
    try {
      setAddingNote(true);
      const res = await apiRequest(`/admin/orders/${selectedOrder._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: internalNoteText })
      });
      if (res.success) {
        setSelectedOrder({ ...selectedOrder, auditLog: res.auditLog });
        setInternalNoteText('');
      }
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      const res = await apiRequest(`/admin/orders/${selectedOrder._id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: cancelReason || 'Admin cancelled order',
          restoreStock
        })
      });

      if (res.success) {
        setSelectedOrder(res.order);
        setCancelModalOpen(false);
        fetchOrders(pagination.page);
        alert(`Order #${res.order.orderNumber} successfully cancelled.`);
      }
    } catch (err) {
      alert('Cancellation error: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2F2EE] dark:bg-[#202020] border-none rounded-xl text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-neutral-400"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-medium hover:opacity-90 transition"
          >
            Filter
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
          >
            <option value="">All Payment Methods</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="PREPAID">Prepaid (Razorpay)</option>
          </select>

          {/* Order Status */}
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
          >
            <option value="">All Order Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
          >
            <option value="">All Payment States</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-2" />
            Loading orders ledger...
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {orders.map((ord) => {
                  const isCod = ord.paymentMethod === 'COD';
                  const isPaid = ord.paymentStatus === 'PAID' || ord.payment?.status === 'captured';

                  return (
                    <tr
                      key={ord._id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#111111] dark:text-white">
                        #{ord.orderNumber}
                      </td>

                      <td className="py-3 px-3 text-neutral-400 font-mono text-[11px]">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#111111] dark:text-white">{ord.customer?.name || 'Customer'}</p>
                        <p className="text-[10px] font-mono text-neutral-400">{ord.customer?.email || ''}</p>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isCod ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                        }`}>
                          {ord.paymentMethod || 'PREPAID'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-600 dark:text-neutral-300">
                        {ord.items?.length || 1} {ord.items?.length === 1 ? 'item' : 'items'}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#111111] dark:text-white">
                        {formatPrice(ord.pricing?.totalAmountPaise || 0)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : ord.paymentStatus === 'FAILED' || ord.payment?.status === 'failed'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {ord.paymentStatus || ord.payment?.status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            ord.orderStatus === 'DELIVERED' || ord.fulfilmentStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'CONFIRMED'
                              ? 'bg-teal-100 text-teal-800'
                              : ord.orderStatus === 'SHIPPED' || ord.fulfilmentStatus === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.orderStatus === 'CANCELLED' || ord.fulfilmentStatus === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.orderStatus || ord.fulfilmentStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openOrderDetails(ord._id)}
                          className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700 bg-[#FAF8F5] dark:bg-neutral-800 text-[11px] font-mono font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-400 font-mono">
            No orders match the specified criteria.
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Drawer */}
      {orderDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#FDFCFA] dark:bg-[#151515] h-full shadow-2xl flex flex-col border-l border-[#EAEAE6] dark:border-[#222222]">
            {/* Header */}
            <div className="p-5 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#111111] dark:text-white">
                    #{selectedOrder?.orderNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedOrder?.fulfilmentStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder?.fulfilmentStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder?.fulfilmentStatus?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                  Placed on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setOrderDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading || !selectedOrder ? (
              <div className="p-12 text-center text-xs font-mono text-neutral-400">
                Loading order dossier...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Customer & Shipping Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] dark:bg-[#1C1C1C] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828]">
                  <div>
                    <h4 className="font-mono uppercase text-[10px] text-neutral-400 font-bold mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Customer Identity
                    </h4>
                    <p className="font-bold text-[#111111] dark:text-white">{selectedOrder.customer?.name}</p>
                    <p className="text-neutral-500 font-mono">{selectedOrder.customer?.email}</p>
                    <p className="text-neutral-500 font-mono">{selectedOrder.customer?.phone}</p>
                  </div>

                  <div>
                    <h4 className="font-mono uppercase text-[10px] text-neutral-400 font-bold mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Shipping Address
                    </h4>
                    <p className="font-bold text-[#111111] dark:text-white">{selectedOrder.shippingAddress?.fullName}</p>
                    <p className="text-neutral-500">{selectedOrder.shippingAddress?.addressLine1}</p>
                    {selectedOrder.shippingAddress?.addressLine2 && (
                      <p className="text-neutral-500">{selectedOrder.shippingAddress?.addressLine2}</p>
                    )}
                    <p className="text-neutral-500 font-mono">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                    </p>
                  </div>
                </div>

                {/* Purchased Items List */}
                <div>
                  <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider mb-3 text-neutral-700 dark:text-neutral-300">
                    Purchased T-Shirts ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222] border border-[#EAEAE6] dark:border-[#222222] rounded-xl overflow-hidden">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white dark:bg-[#181818]">
                        <div className="flex items-center gap-3">
                          {item.previewImageUrl ? (
                            <img
                              src={item.previewImageUrl}
                              alt={item.productName}
                              className="w-12 h-14 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-800"
                            />
                          ) : (
                            <div className="w-12 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-400">
                              BLC
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#111111] dark:text-white">{item.productName}</p>
                            <p className="text-[10px] font-mono text-neutral-400">
                              Size: {item.selectedSize} | Qty: {item.quantity} | {item.isCustom ? 'Custom POD Print' : 'Standard Catalogue'}
                            </p>
                            {item.productionSpecs && item.productionSpecs.frontArtworkUrl && (
                              <a
                                href={item.productionSpecs.frontArtworkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline font-mono mt-0.5"
                              >
                                View 300 DPI Artwork Vector <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold">
                          {formatPrice(item.lineTotalPaise)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828] space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.pricing?.subtotalPaise || 0)}</span>
                  </div>
                  {selectedOrder.pricing?.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount ({selectedOrder.couponCode || 'PROMO'})</span>
                      <span>-{formatPrice(selectedOrder.pricing.discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping Fee</span>
                    <span>{selectedOrder.pricing?.shippingFeePaise === 0 ? 'FREE' : formatPrice(selectedOrder.pricing?.shippingFeePaise || 0)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>GST (Apparel 5%)</span>
                    <span>{formatPrice(selectedOrder.pricing?.taxPaise || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#EAEAE6] dark:border-[#282828] flex justify-between font-bold text-xs text-[#111111] dark:text-white">
                    <span>{selectedOrder.paymentMethod === 'COD' ? 'Total Due (COD)' : 'Total Paid (Online)'}</span>
                    <span>{formatPrice(selectedOrder.pricing?.totalAmountPaise || 0)}</span>
                  </div>
                </div>

                {/* Payment Overview & Protection Notice */}
                <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828] space-y-2 text-xs">
                  <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-neutral-700 dark:text-neutral-300">
                    Payment Status & Evidence
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div>
                      <span className="text-neutral-400 block">Method</span>
                      <strong className="text-[#111111] dark:text-white">
                        {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Razorpay)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Payment State</span>
                      <strong className={`uppercase ${
                        selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {selectedOrder.paymentStatus || selectedOrder.payment?.status}
                      </strong>
                    </div>
                    {selectedOrder.payment?.razorpayPaymentId && (
                      <div className="col-span-2">
                        <span className="text-neutral-400 block">Gateway Transaction Ref</span>
                        <code className="text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">
                          {selectedOrder.payment.razorpayPaymentId}
                        </code>
                      </div>
                    )}
                  </div>
                  {selectedOrder.paymentMethod === 'PREPAID' && selectedOrder.paymentStatus !== 'PAID' && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Prepaid verification required. Admins cannot manually mark prepaid orders as PAID without gateway proof.</span>
                    </div>
                  )}
                  {selectedOrder.paymentMethod === 'COD' && selectedOrder.paymentStatus === 'UNPAID' && (
                    <p className="text-[10px] text-neutral-500">
                      Cash on Delivery order: marking this order as Delivered will automatically record payment as PAID (cash collected).
                    </p>
                  )}
                </div>

                {/* Fulfilment Lifecycle & Tracking Actions */}
                <form onSubmit={handleUpdateStatus} className="bg-white dark:bg-[#181818] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828] space-y-3">
                  <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-neutral-700 dark:text-neutral-300">
                    Dispatch & Status Lifecycle
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Fulfilment Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing / In Production</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered (Record Cash Collection for COD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Courier Partner</label>
                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="BlueDart / Delhivery / BlrExpress"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">AWB Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. BLU-99881122"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Status Note (Optional)</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Dispatched via express air lane"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-[11px]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      disabled={selectedOrder.fulfilmentStatus === 'cancelled'}
                      className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] disabled:opacity-30"
                    >
                      Cancel & Refund Order...
                    </button>

                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-[11px]"
                    >
                      {updatingStatus ? 'Updating...' : 'Save Fulfilment Status'}
                    </button>
                  </div>
                </form>

                {/* Audit Trail & Internal Notes */}
                <div className="space-y-3">
                  <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-neutral-700 dark:text-neutral-300">
                    Order Audit Log & Operator Notes
                  </h4>

                  {/* Add note input */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      placeholder="Add internal staff note..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-[11px]"
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !internalNoteText.trim()}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg text-[11px] disabled:opacity-40"
                    >
                      Add Note
                    </button>
                  </form>

                  {/* Log feed */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedOrder.auditLog && selectedOrder.auditLog.length > 0 ? (
                      selectedOrder.auditLog.map((log, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C1C1C] border border-[#EAEAE6] dark:border-[#282828] text-[11px]">
                          <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px]">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{log.actor}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="font-medium text-[#111111] dark:text-white mt-0.5">{log.action}</p>
                          {log.note && <p className="text-neutral-500 mt-0.5">{log.note}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-400 font-mono text-[11px]">No audit logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-md rounded-2xl border border-[#EAEAE6] dark:border-[#222222] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-heading font-bold">Cancel Order #{selectedOrder.orderNumber}</h3>
            </div>
            <p className="text-neutral-500">
              Are you sure you want to cancel this order? This action will mark the order as cancelled and note the refund in the accounting records.
            </p>

            <div>
              <label className="block font-semibold mb-1">Reason for cancellation</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested size change or address cancellation"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="rounded text-black focus:ring-0"
              />
              <span>Restore physical variant stock in database</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Order Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
