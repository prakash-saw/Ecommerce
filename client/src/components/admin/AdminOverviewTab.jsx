import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  ChevronRight,
  Calendar,
  Sparkles
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminOverviewTab({ onNavigateToOrder, onNavigateToProduct, onNavigateToInventory }) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest(`/admin/analytics/overview?period=${selectedPeriod}`);
      if (res.success) {
        setData(res.analytics);
      } else {
        setError(res.message || 'Failed to load business analytics.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with analytics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(period);
  }, [period]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Calculating Real Business Metrics...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mb-1">Analytics Unavailable</h3>
        <p className="text-xs text-neutral-500 mb-4">{error}</p>
        <button
          onClick={() => fetchOverview(period)}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-black transition"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const {
    totalRevenuePaise = 0,
    totalCapturedOrders = 0,
    totalOrdersCount = 0,
    pendingOrdersCount = 0,
    averageOrderValuePaise = 0,
    salesTrends = [],
    bestSellers = [],
    inventoryAlerts = {},
    recentOrders = [],
    statusDistribution = {}
  } = data || {};

  // Compute maximum daily revenue for SVG scaling
  const maxTrendRevenue = Math.max(...salesTrends.map(t => t.revenuePaise), 1000);

  return (
    <div className="space-y-6">
      {/* Top Banner & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Live Ledger
            </span>
          </div>
          <h2 className="text-xl font-heading font-black tracking-tight text-[#111111] dark:text-white">
            Operational Overview & Financial Health
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Aggregated exclusively from captured payments. Cancelled and refunded transactions are excluded.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F2F2EE] dark:bg-[#202020] p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: '7d', label: 'Past 7 Days' },
            { id: '30d', label: 'Past 30 Days' },
            { id: '90d', label: 'Past 90 Days' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === item.id
                  ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Captured Revenue */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Net Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-black text-[#111111] dark:text-white tracking-tight">
            {formatPrice(totalRevenuePaise)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>From {totalCapturedOrders} successfully paid orders</span>
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between text-[11px]">
            <span className="text-neutral-500 dark:text-neutral-400">Uncollected COD:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatPrice(data?.codUncollected?.totalPaise || 0)} ({data?.codUncollected?.orderCount || 0} orders)
            </span>
          </div>
        </div>

        {/* Total & Pending Orders */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Orders Volume</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-black text-[#111111] dark:text-white tracking-tight">
            {totalOrdersCount}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{pendingOrdersCount} orders awaiting dispatch</span>
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-black text-[#111111] dark:text-white tracking-tight">
            {formatPrice(averageOrderValuePaise)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Total Revenue ÷ Paid Orders
          </p>
        </div>

        {/* Low Stock Alerts Count */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Stock Depletion Alerts</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (inventoryAlerts.lowStockCount || 0) + (inventoryAlerts.outOfStockCount || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-black text-[#111111] dark:text-white tracking-tight">
            {(inventoryAlerts.lowStockCount || 0) + (inventoryAlerts.outOfStockCount || 0)}
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-1">
            {inventoryAlerts.outOfStockCount || 0} out of stock, {inventoryAlerts.lowStockCount || 0} low stock
          </p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-heading font-bold text-[#111111] dark:text-white">
              Revenue & Demand Trajectory ({period})
            </h3>
            <p className="text-xs text-neutral-400">
              Daily revenue distribution in INR paise based on paid checkout dates.
            </p>
          </div>
          <div className="text-xs font-mono text-neutral-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900 dark:bg-white inline-block"></span> Daily Revenue
            </span>
          </div>
        </div>

        {/* Visual Trend Bars (SVG/CSS Hybrid for responsive crispness) */}
        {salesTrends.length > 0 ? (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-[#EAEAE6] dark:border-[#222222]">
              {salesTrends.map((trend, idx) => {
                const heightPercent = Math.max(4, Math.round((trend.revenuePaise / maxTrendRevenue) * 100));
                return (
                  <div
                    key={trend.date}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap bg-black text-white text-[10px] py-1 px-2 rounded shadow-lg font-mono">
                      <span>{trend.label}</span>
                      <span className="font-bold text-emerald-400">{formatPrice(trend.revenuePaise)}</span>
                      <span className="text-[9px] text-neutral-400">{trend.ordersCount} orders</span>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        trend.revenuePaise > 0
                          ? 'bg-[#111111] dark:bg-neutral-200 group-hover:bg-emerald-600'
                          : 'bg-neutral-200/60 dark:bg-neutral-800/60'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            {/* Date range axis label */}
            <div className="flex justify-between text-[10px] font-mono text-neutral-400 pt-1">
              <span>{salesTrends[0]?.label || ''}</span>
              <span>{salesTrends[Math.floor(salesTrends.length / 2)]?.label || ''}</span>
              <span>{salesTrends[salesTrends.length - 1]?.label || ''}</span>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-neutral-400 font-mono">
            No sales recorded in the selected period.
          </div>
        )}
      </div>

      {/* Grid: Best Sellers & Inventory Depletion Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider">
                Top Performing Products
              </h3>
              <p className="text-xs text-neutral-400">By quantity sold and revenue</p>
            </div>
          </div>

          {bestSellers.length > 0 ? (
            <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
              {bestSellers.map((item, index) => (
                <div key={item._id || index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#111111] dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        {item.totalQuantitySold} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-[#111111] dark:text-white">
                      {formatPrice(item.totalRevenuePaise)}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Captured
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400 font-mono">
              No sales data recorded yet.
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider">
                Variant Inventory Watchlist
              </h3>
              <p className="text-xs text-neutral-400">Variants below threshold ({inventoryAlerts.lowStockThreshold || 10} units)</p>
            </div>
            {onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1"
              >
                Full Matrix <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {inventoryAlerts.items && inventoryAlerts.items.length > 0 ? (
            <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
              {inventoryAlerts.items.slice(0, 5).map((variant) => (
                <div key={variant.variantId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#111111] dark:text-white">
                        {variant.productName}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 rounded">
                        {variant.size}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400">
                      SKU: {variant.sku} {variant.colorName ? `• ${variant.colorName}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        variant.stockQuantity === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {variant.stockQuantity === 0 ? 'OUT OF STOCK' : `${variant.stockQuantity} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400 font-mono">
              All variants are healthy and above minimum thresholds.
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider">
              Recent Orders Feed
            </h3>
            <p className="text-xs text-neutral-400">Latest customer purchases across India</p>
          </div>
          {onNavigateToOrder && (
            <button
              onClick={() => onNavigateToOrder(null)}
              className="text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1"
            >
              View All Orders <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Fulfilment</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#111111] dark:text-white">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-[#111111] dark:text-white">{ord.customer?.name || 'Customer'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{ord.customer?.email || ''}</p>
                    </td>
                    <td className="py-3 px-3 text-neutral-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {formatPrice(ord.pricing?.totalAmountPaise || 0)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          ord.payment?.status === 'captured'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : ord.payment?.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {ord.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                        {ord.fulfilmentStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onNavigateToOrder && (
                        <button
                          onClick={() => onNavigateToOrder(ord._id)}
                          className="px-2 py-1 rounded bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-[10px] font-mono hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                        >
                          Manage
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-neutral-400 font-mono">
            No recent orders found.
          </div>
        )}
      </div>
    </div>
  );
}
