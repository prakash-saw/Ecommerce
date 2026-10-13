import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

// Modular Admin Subcomponents
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminProductsTab from '../components/admin/AdminProductsTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminInventoryTab from '../components/admin/AdminInventoryTab';
import AdminCouponsTab from '../components/admin/AdminCouponsTab';
import AdminReviewsSupportTab from '../components/admin/AdminReviewsSupportTab';
import AdminCollectionsDropsTab from '../components/admin/AdminCollectionsDropsTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminPODQueueTab from '../components/admin/AdminPODQueueTab';

export default function AdminDashboardPage() {
  const { user, login, logout, isAdmin } = useAuth();

  // Authentication form state for unauthenticated admins
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active dashboard navigation tab
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Target item for deep navigation (e.g. jumping directly to a specific order)
  const [focusedOrderId, setFocusedOrderId] = useState(null);

  // Badge statistics
  const [badgeStats, setBadgeStats] = useState({
    pendingOrdersCount: 0,
    lowStockCount: 0,
    openTicketsCount: 0,
    podQueueCount: 0
  });

  // Fetch badges counts periodically or on tab switch
  const fetchBadges = async () => {
    try {
      const res = await apiRequest('/admin/analytics/overview?period=7d');
      if (res.success && res.analytics) {
        setBadgeStats({
          pendingOrdersCount: res.analytics.pendingOrdersCount || 0,
          lowStockCount: res.analytics.inventoryAlerts?.lowStockCount || 0,
          openTicketsCount: 0,
          podQueueCount: 0
        });
      }
    } catch (err) {
      // Non-fatal badge update
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchBadges();
    }
  }, [user, isAdmin, refreshKey]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      setLoginError('');
      const res = await login(adminEmail, adminPassword);
      if (!res.success) {
        setLoginError(res.message || 'Invalid administrator credentials');
      } else if (res.user?.role !== 'admin') {
        setLoginError('Access denied: You do not have administrator authorization.');
        logout();
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    await fetchBadges();
    setTimeout(() => setRefreshing(false), 500);
  };

  // If not authenticated as admin, display clean minimalist portal
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl border border-[#EAEAE6] dark:border-[#222222] p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-heading font-black tracking-tight text-[#111111] dark:text-white uppercase">
              BLANC ATELIER
            </h1>
            <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
              Restricted Admin Console
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@blancatelier.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">
                Master Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-[#111111] text-white dark:bg-white dark:text-black rounded-xl font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50 shadow-md"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#EAEAE6] dark:border-[#222222] text-center">
            <p className="text-[11px] font-mono text-neutral-400">
              Only authorized staff credentials with active database permissions can access this portal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine active tab title for top bar
  const titlesMap = {
    overview: 'Financial & Operational Overview',
    products: 'Product Matrix & Silhouettes',
    orders: 'Customer Orders Ledger',
    inventory: 'Variant Inventory Management',
    coupons: 'Coupons & Promotional Rules',
    reviews_support: 'Reviews & Customer Enquiries',
    collections_drops: 'Curated Collections & Drops',
    pod_queue: 'DTG Print Pre-Press Queue',
    settings: 'Storewide Controls & Preferences'
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#0E0E0E] text-[#111111] dark:text-[#EDEDED] flex flex-col lg:flex-row antialiased">
      {/* 1. Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={badgeStats}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          title={titlesMap[activeTab] || 'Admin Console'}
          subtitle={titlesMap[activeTab]}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          setIsMobileOpen={setIsMobileOpen}
          onLogout={logout}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              key={`overview-${refreshKey}`}
              onNavigateToOrder={(orderId) => {
                setFocusedOrderId(orderId);
                setActiveTab('orders');
              }}
              onNavigateToProduct={() => setActiveTab('products')}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab key={`products-${refreshKey}`} />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              key={`orders-${refreshKey}`}
              initialOrderId={focusedOrderId}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryTab key={`inventory-${refreshKey}`} />
          )}

          {activeTab === 'coupons' && (
            <AdminCouponsTab key={`coupons-${refreshKey}`} />
          )}

          {activeTab === 'reviews_support' && (
            <AdminReviewsSupportTab key={`reviews-${refreshKey}`} />
          )}

          {activeTab === 'collections_drops' && (
            <AdminCollectionsDropsTab key={`collections-${refreshKey}`} />
          )}

          {activeTab === 'pod_queue' && (
            <AdminPODQueueTab key={`pod-${refreshKey}`} />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              key={`settings-${refreshKey}`}
              onLogout={logout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
