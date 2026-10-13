import React from 'react';
import { Menu, ExternalLink, LogOut, RefreshCw, Bell, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminTopBar({
  title,
  subtitle,
  onRefresh,
  refreshing,
  setIsMobileOpen,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#FDFCFA]/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-[#EAEAE6] dark:border-[#222222] px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg border border-[#E0E0DC] dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Open Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
            <span>ADMIN CONSOLE</span>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-300 uppercase font-semibold">{title}</span>
          </div>
          <h1 className="text-base lg:text-lg font-heading font-black tracking-tight text-[#111111] dark:text-white">
            {subtitle || title}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50"
            title="Refresh active dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Storefront Link */}
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800/80 border border-[#E0E0DC] dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition"
        >
          <span className="hidden sm:inline">Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-950/60 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          title="Sign out of Admin Session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
