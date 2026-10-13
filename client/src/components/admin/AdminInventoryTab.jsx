import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  Sliders,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminInventoryTab() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [changeQuantity, setChangeQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('manual_adjustment');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Movement History Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [movements, setMovements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await apiRequest(`/admin/inventory?${params.toString()}`);
      if (res.success) {
        setInventory(res.inventory || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
        if (res.lowStockThreshold) setLowStockThreshold(res.lowStockThreshold);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (variantId = null) => {
    try {
      setHistoryLoading(true);
      setHistoryDrawerOpen(true);
      const url = variantId ? `/admin/inventory/movements?variantId=${variantId}` : '/admin/inventory/movements';
      const res = await apiRequest(url);
      if (res.success) {
        setMovements(res.movements || []);
      }
    } catch (err) {
      alert('Error fetching movement history: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(1);
  }, [statusFilter]);

  const handleOpenAdjust = (variant) => {
    setSelectedVariant(variant);
    setChangeQuantity(0);
    setAdjustmentReason('manual_adjustment');
    setAdjustmentNotes('');
    setAdjustModalOpen(true);
  };

  const handleApplyAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedVariant || changeQuantity === 0) {
      alert('Please enter a non-zero adjustment amount (+ or -).');
      return;
    }

    try {
      setAdjusting(true);
      const res = await apiRequest('/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          changeQuantity,
          reason: adjustmentReason,
          notes: adjustmentNotes
        })
      });

      if (res.success) {
        setAdjustModalOpen(false);
        fetchInventory(pagination.page);
        alert(`Stock for SKU ${selectedVariant.sku} successfully updated!`);
      } else {
        alert(res.message || 'Adjustment rejected');
      }
    } catch (err) {
      alert('Adjustment failed: ' + err.message);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Movement Log Trigger */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by variant SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInventory(1)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2F2EE] dark:bg-[#202020] border-none rounded-xl text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-neutral-400"
            />
          </div>
          <button
            onClick={() => fetchInventory(1)}
            className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-medium hover:opacity-90 transition"
          >
            Search
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;{lowStockThreshold})</option>
            <option value="low_stock">Low Stock (≤{lowStockThreshold})</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Movement Log Button */}
          <button
            onClick={() => fetchMovements(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E0E0DC] dark:border-neutral-700 bg-[#FAF8F5] dark:bg-neutral-800 text-xs font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History Log</span>
          </button>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-2" />
            Loading variant inventory levels...
          </div>
        ) : inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                <tr>
                  <th className="py-3 px-4">Variant SKU</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Color Shade</th>
                  <th className="py-3 px-3">Unit Price</th>
                  <th className="py-3 px-3">Available Stock</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {inventory.map((item) => (
                  <tr key={item.variantId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#111111] dark:text-white">
                      {item.sku}
                    </td>

                    <td className="py-3 px-3 font-medium text-[#111111] dark:text-white">
                      {item.productName}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold">
                      {item.size}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-neutral-300 inline-block"
                          style={{ backgroundColor: item.color?.hex || '#FDFBF7' }}
                        />
                        <span className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                          {item.color?.name || 'Blanc White'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {formatPrice(item.pricePaise)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-sm">
                      {item.stockQuantity}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          item.stockStatus === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : item.stockStatus === 'low_stock'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {item.stockStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-[11px] font-mono hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                        >
                          Adjust Units
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-400 font-mono">
            No variant items found matching criteria.
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} variants)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchInventory(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchInventory(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Inventory Modal */}
      {adjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-md rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-[#222222] pb-3">
              <div>
                <h3 className="text-sm font-heading font-black text-[#111111] dark:text-white">
                  Adjust Physical Stock: {selectedVariant.sku}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {selectedVariant.productName} ({selectedVariant.size})
                </p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-3 rounded-xl flex items-center justify-between font-mono">
              <span className="text-neutral-500">Current In-Stock Quantity:</span>
              <span className="font-bold text-sm text-[#111111] dark:text-white">{selectedVariant.stockQuantity} units</span>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Quantity Change (+ to add, - to deduct) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeQuantity(prev => prev - 5)}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeQuantity(prev => prev - 1)}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={changeQuantity}
                    onChange={(e) => setChangeQuantity(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 px-3 py-2 text-center rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono font-bold text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setChangeQuantity(prev => prev + 1)}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeQuantity(prev => prev + 5)}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    +5
                  </button>
                </div>
                <p className="text-[10px] font-mono text-neutral-400 mt-1">
                  New Resulting Stock: <span className="font-bold">{selectedVariant.stockQuantity + changeQuantity}</span> units
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Adjustment Reason *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                >
                  <option value="manual_adjustment">Manual Staff Adjustment</option>
                  <option value="restock">Factory Restock Inflow</option>
                  <option value="physical_audit">Physical Warehouse Audit</option>
                  <option value="damage">Damaged Garment Write-off</option>
                  <option value="order_return">Customer Return Restock</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Audit Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Lot batch #404 delivered from Tirupur knitting mill"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAEAE6] dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || changeQuantity === 0}
                  className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {adjusting ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Drawer */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#FDFCFA] dark:bg-[#151515] h-full shadow-2xl flex flex-col border-l border-[#EAEAE6] dark:border-[#222222]">
            <div className="p-5 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-black text-[#111111] dark:text-white uppercase tracking-wider">
                  Inventory Movement Audit Trail
                </h3>
                <p className="text-[11px] text-neutral-400">Immutable ledger of all warehouse stock changes and reasons.</p>
              </div>
              <button onClick={() => setHistoryDrawerOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {historyLoading ? (
                <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading audit records...</div>
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <div key={m._id} className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-[#EAEAE6] dark:border-[#282828] text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-[#111111] dark:text-white">{m.sku}</span>
                      <span className={`font-mono font-bold ${m.changeQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.changeQuantity > 0 ? `+${m.changeQuantity}` : m.changeQuantity} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Reason: <span className="text-neutral-700 dark:text-neutral-300 capitalize">{m.reason?.replace(/_/g, ' ')}</span></span>
                      <span>Stock: {m.previousQuantity} → {m.newQuantity}</span>
                    </div>
                    {m.notes && <p className="text-[11px] text-neutral-500 mt-1">{m.notes}</p>}
                    <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <span>By: {m.adminEmail}</span>
                      <span>{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs font-mono text-neutral-400">No stock movements recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
