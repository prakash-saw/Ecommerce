import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, RefreshCw, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-[#FAFAF8] pt-16 pb-12 border-t border-neutral-900">
      {/* Brand values bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center mx-auto sm:mx-0">
            <span className="font-mono text-xs font-bold">240</span>
          </div>
          <h4 className="text-xs uppercase tracking-widest font-semibold">240 GSM Heavyweight</h4>
          <p className="text-xs text-neutral-400">Pure combed compact cotton. Pre-shrunk bio-washed fabric.</p>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center mx-auto sm:mx-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs uppercase tracking-widest font-semibold">Fine Direct-to-Garment</h4>
          <p className="text-xs text-neutral-400">Japanese high-density pigment inks with zero heavy hand-feel.</p>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center mx-auto sm:mx-0">
            <Truck className="w-4 h-4" />
          </div>
          <h4 className="text-xs uppercase tracking-widest font-semibold">Pan-India Express</h4>
          <p className="text-xs text-neutral-400">Dispatched in 3–5 working days via BlueDart & Delhivery air cargo.</p>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center mx-auto sm:mx-0">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs uppercase tracking-widest font-semibold">Crafted in India</h4>
          <p className="text-xs text-neutral-400">Ethically knitted, tailored and printed in Tirupur & Bangalore.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <span className="font-editorial text-2xl font-bold tracking-wider">BLANC ATELIER</span>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
            Independent minimalist apparel and print-on-demand studio for college creators and modern Gen Z. Built on heavyweight architectural silhouettes, ethical cotton, and precise typographical graphics.
          </p>
          <div className="text-xs text-neutral-500 font-mono">
            Atelier No. 4B, Indiranagar 100ft Rd, Bengaluru 560038
          </div>
        </div>

        {/* Studio & Shop links */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">Explore</h5>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li><Link to="/shop" className="hover:text-white transition-colors">Ready-to-Wear</Link></li>
            <li><Link to="/customize" className="hover:text-white transition-colors">Custom POD Studio</Link></li>
            <li><Link to="/drops" className="hover:text-white transition-colors">Limited Capsule Drops</Link></li>
            <li><Link to="/rewards" className="hover:text-white transition-colors">Rewards Circle & Referrals</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist Pieces</Link></li>
            <li><Link to="/track-order" className="hover:text-white transition-colors">Track Your Package</Link></li>
          </ul>
        </div>

        {/* Production & Policies */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">Policies & Terms</h5>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li><Link to="/policies?tab=pod" className="hover:text-white transition-colors">Custom Printing Policy</Link></li>
            <li><Link to="/policies?tab=shipping" className="hover:text-white transition-colors">Shipping & Timelines</Link></li>
            <li><Link to="/policies?tab=returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/policies?tab=care" className="hover:text-white transition-colors">Garment Care Guide</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-neutral-300">Atelier Desk</h5>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Questions regarding artwork resolution, sizing measurements, or custom order status?
          </p>
          <div className="text-xs font-mono text-neutral-200">
            desk@blancatelier.com
          </div>
          <div className="pt-1">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline text-xs font-mono flex items-center gap-1"
            >
              ✦ WhatsApp Care Available
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-neutral-800 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © {new Date().getFullYear()} BLANC ATELIER INDIA. All rights reserved.
        </div>
        <div className="flex space-x-6 text-[11px] uppercase tracking-wider">
          <span>Encrypted Razorpay Gateway</span>
          <span>•</span>
          <span>100% Organic Indian Cotton</span>
        </div>
      </div>
    </footer>
  );
}
