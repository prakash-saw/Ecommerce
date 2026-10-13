import React from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  return (
    <div className="bg-[#111111] text-[#FAFAF8] text-xs py-2 px-4 tracking-wide text-center font-medium border-b border-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-[11px] sm:text-xs">
        <span className="hidden sm:inline">240 GSM HEAVYWEIGHT COTTON DROP</span>
        <span className="hidden sm:inline text-neutral-500">•</span>
        <span>COMPLIMENTARY SHIPPING IN INDIA ON ORDERS OVER ₹1,499</span>
        <span className="text-neutral-500">•</span>
        <Link to="/customize" className="underline underline-offset-4 hover:text-neutral-300 font-semibold inline-flex items-center gap-1">
          STUDIO POD ACTIVE <ArrowRight className="w-3 h-3 inline" />
        </Link>
      </div>
    </div>
  );
}
