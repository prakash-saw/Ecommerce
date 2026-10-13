import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminCouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formState, setFormState] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValueRupees: 999,
    maxDiscountRupees: 500,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '',
    perCustomerLimit: 1,
    firstOrderOnly: false,
    status: 'active'
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/coupons');
      if (res.success) {
        setCoupons(res.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormError('');
    setFormState({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      minOrderValueRupees: 999,
      maxDiscountRupees: 500,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: '',
      perCustomerLimit: 1,
      firstOrderOnly: false,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('edit');
    setEditingId(c._id);
    setFormError('');
    setFormState({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountType === 'percentage' ? c.discountValue : c.discountValue / 100,
      minOrderValueRupees: (c.minOrderValuePaise || 0) / 100,
      maxDiscountRupees: c.maxDiscountPaise ? c.maxDiscountPaise / 100 : '',
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: c.usageLimit || '',
      perCustomerLimit: c.perCustomerLimit || 1,
      firstOrderOnly: Boolean(c.firstOrderOnly),
      status: c.status
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');

      if (!formState.code.trim()) {
        setFormError('Coupon code is required.');
        setSubmitting(false);
        return;
      }

      const discountValue = formState.discountType === 'percentage'
        ? parseInt(formState.discountValue, 10)
        : Math.round(parseFloat(formState.discountValue) * 100);

      const payload = {
        code: formState.code.trim().toUpperCase(),
        discountType: formState.discountType,
        discountValue,
        minOrderValuePaise: Math.round(parseFloat(formState.minOrderValueRupees || 0) * 100),
        maxDiscountPaise: formState.maxDiscountRupees
          ? Math.round(parseFloat(formState.maxDiscountRupees) * 100)
          : null,
        startDate: formState.startDate,
        expiryDate: formState.expiryDate || null,
        usageLimit: formState.usageLimit ? parseInt(formState.usageLimit, 10) : null,
        perCustomerLimit: parseInt(formState.perCustomerLimit, 10) || 1,
        firstOrderOnly: formState.firstOrderOnly,
        status: formState.status
      };

      let res;
      if (modalMode === 'create') {
        res = await apiRequest('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiRequest(`/admin/coupons/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        setFormError(res.message || 'Operation failed');
      }
    } catch (err) {
      setFormError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId, code) => {
    if (!window.confirm(`Disable coupon code "${code}"?`)) return;
    try {
      const res = await apiRequest(`/admin/coupons/${couponId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        fetchCoupons();
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Create Trigger */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black tracking-tight text-[#111111] dark:text-white">
            Coupons & Promotional Rules
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Server-enforced discount engine validating usage limits, minimum baskets, and expiry dates.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-2" />
            Loading promotional coupons...
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-3">Discount</th>
                  <th className="py-3 px-3">Min Order</th>
                  <th className="py-3 px-3">Max Cap</th>
                  <th className="py-3 px-3">Usage</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {coupons.map((c) => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();

                  return (
                    <tr key={c._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#111111] dark:text-white bg-[#FAF8F5] dark:bg-neutral-800 px-2 py-0.5 rounded border border-[#EAEAE6] dark:border-neutral-700">
                            {c.code}
                          </span>
                          {c.firstOrderOnly && (
                            <span className="text-[9px] font-mono text-neutral-400 uppercase">
                              1st Order
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-[#111111] dark:text-white">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : `${formatPrice(c.discountValue)} FLAT`}
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-500">
                        {c.minOrderValuePaise > 0 ? formatPrice(c.minOrderValuePaise) : 'No Min'}
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-500">
                        {c.maxDiscountPaise ? formatPrice(c.maxDiscountPaise) : 'No Cap'}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-[#111111] dark:text-white">{c.usedCount || 0}</span>
                        <span className="text-neutral-400"> / {c.usageLimit || '∞'}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-500 text-[11px]">
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Never'}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            isExpired
                              ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                              : c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {isExpired ? 'Expired' : c.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c._id, c.code)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Disable Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-400 font-mono">
            No promotional coupons configured yet.
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-lg rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-[#222222] pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-[#111111] dark:text-white">
                  {modalMode === 'create' ? 'Create Promotional Coupon' : `Edit Coupon: ${formState.code}`}
                </h3>
                <p className="text-neutral-400">Configure discount value, thresholds, and server-side constraints.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MONSOON20"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select
                    value={formState.discountType}
                    onChange={(e) => setFormState({ ...formState, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount (₹ INR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Value {formState.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formState.discountValue}
                    onChange={(e) => setFormState({ ...formState, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Min Cart (₹)</label>
                  <input
                    type="number"
                    value={formState.minOrderValueRupees}
                    onChange={(e) => setFormState({ ...formState, minOrderValueRupees: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={formState.maxDiscountRupees}
                    onChange={(e) => setFormState({ ...formState, maxDiscountRupees: e.target.value })}
                    placeholder="No cap"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formState.expiryDate}
                    onChange={(e) => setFormState({ ...formState, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Global Usage Limit</label>
                  <input
                    type="number"
                    value={formState.usageLimit}
                    onChange={(e) => setFormState({ ...formState, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={formState.firstOrderOnly}
                    onChange={(e) => setFormState({ ...formState, firstOrderOnly: e.target.checked })}
                    className="rounded text-black focus:ring-0"
                  />
                  <span>First order customer only</span>
                </label>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="font-semibold">Status:</span>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="px-2 py-1 rounded bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
