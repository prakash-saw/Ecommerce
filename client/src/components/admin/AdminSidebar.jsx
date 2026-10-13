import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Tag,
  MessageSquare,
  FolderKanban,
  Settings,
  Printer,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  stats = {},
  isMobileOpen,
  setIsMobileOpen
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: null
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: stats.pendingOrdersCount > 0 ? stats.pendingOrdersCount : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: stats.lowStockCount > 0 ? stats.lowStockCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'coupons',
      label: 'Coupons',
      icon: Tag,
      badge: null
    },
    {
      id: 'reviews_support',
      label: 'Reviews & Support',
      icon: MessageSquare,
      badge: stats.openTicketsCount > 0 ? stats.openTicketsCount : null,
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'collections_drops',
      label: 'Collections & Drops',
      icon: FolderKanban,
      badge: null
    },
    {
      id: 'pod_queue',
      label: 'POD Studio Queue',
      icon: Printer,
      badge: stats.podQueueCount > 0 ? stats.podQueueCount : null,
      badgeColor: 'bg-noir-900 text-white dark:bg-white dark:text-black'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#FDFCFA] dark:bg-[#121212] border-r border-[#EAEAE6] dark:border-[#222222] flex flex-col transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-heading font-black tracking-widest text-sm text-[#111111] dark:text-white uppercase">
                BLANC ATELIER
              </span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 mt-0.5">
              Admin Architecture
            </p>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-sm dark:bg-white dark:text-black font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#F2F2EE] dark:hover:bg-neutral-800/60 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-black' : 'text-neutral-400'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full text-white ${
                      item.badgeColor || 'bg-neutral-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operator info footer */}
        <div className="p-4 border-t border-[#EAEAE6] dark:border-[#222222] bg-[#FAF8F5]/50 dark:bg-[#161616]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-[#111111] dark:text-white">
                Authorized Admin
              </p>
              <p className="text-[10px] font-mono text-neutral-500 truncate">
                admin@blancatelier.com
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
