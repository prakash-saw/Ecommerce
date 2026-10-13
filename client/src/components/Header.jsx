import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Heart, Sun, Moon, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemsCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Shop', href: '/shop' },
    { name: 'Customise', href: '/customize', badge: 'POD' },
    { name: 'Drops', href: '/drops', badge: 'Live' },
    { name: 'Rewards', href: '/rewards' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 dark:bg-[#0F0F10]/95 backdrop-blur-md border-b border-[#E5E5E0] dark:border-noir-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Mobile menu trigger */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex items-center">
          <Link to="/" className="group flex flex-col items-center sm:items-start">
            <span className="font-editorial text-2xl sm:text-3xl font-semibold tracking-wider text-black dark:text-white group-hover:opacity-85 transition-opacity">
              BLANC
            </span>
            <span className="text-[9px] tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase -mt-1 font-sans">
              ATELIER INDIA
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-xs tracking-widest uppercase font-medium">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`relative py-1 transition-colors hover:text-black dark:hover:text-white ${
                  isActive
                    ? 'text-black dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {link.name}
                {link.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full uppercase tracking-normal">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black dark:bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right utility icons: Theme, Wishlist, Account, Cart */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-full transition-transform hover:scale-110 focus:outline-none"
            aria-label="Toggle theme mode"
            title={isDark ? "Switch to Blanc Minimal (Light)" : "Switch to Obsidian Noir (Dark)"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Wishlist Icon & Badge */}
          <Link
            to="/wishlist"
            className="relative p-2 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="View Wishlist"
            title="Saved Pieces"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Track Order link */}
          <Link
            to="/track-order"
            className="hidden lg:inline-block text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white tracking-wider uppercase font-medium"
          >
            Track Order
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="px-2.5 py-1 text-[10px] tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold hover:bg-amber-200 transition-colors"
            >
              Admin POD
            </Link>
          )}

          {/* Account Icon */}
          <Link
            to={user ? "/account" : "/account?mode=login"}
            className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Account"
            title={user ? `Signed in as ${user.name}` : 'Sign in'}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          {/* Cart Icon & Count Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors focus:outline-none"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-full">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E0] dark:border-noir-border bg-[#FAFAF8] dark:bg-noir-bg px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm tracking-wider uppercase font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white flex items-center justify-between"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] bg-neutral-900 dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white flex items-center justify-between"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            >
              Track Order
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-amber-900 dark:text-amber-400 font-semibold"
              >
                Admin POD Queue
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
