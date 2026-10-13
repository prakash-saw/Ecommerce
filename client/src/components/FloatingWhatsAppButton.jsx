import React, { useState } from 'react';
import { MessageSquare, X, ChevronRight, Sparkles, Truck, Ruler, Package } from 'lucide-react';
import { createWhatsAppUrl, getFormattedWhatsAppNumber } from '../utils/whatsapp';

export default function FloatingWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const topics = [
    { id: 'sizing', title: 'Sizing & Garment Fit', icon: Ruler, subtitle: 'Find your drop shoulder drape' },
    { id: 'order', title: 'Track / Order Status', icon: Package, subtitle: 'Live dispatch & AWB updates' },
    { id: 'pod_artwork', title: 'Custom POD Artwork', icon: Sparkles, subtitle: 'DPI check & pre-press specs' },
    { id: 'shipping', title: 'Shipping & Delivery', icon: Truck, subtitle: 'Express metro transit inquiries' }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden font-sans">
      {/* Expanded Quick Action Popover */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-lg shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-noir-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Atelier Concierge
                </h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Direct WhatsApp Support ({getFormattedWhatsAppNumber()})
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded transition-colors"
              aria-label="Close WhatsApp Concierge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Need immediate advice on GSM weights, sizing or your custom order? Connect with our human atelier team:
          </p>

          <div className="space-y-1.5">
            {topics.map((t) => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={createWhatsAppUrl(t.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-2 rounded border border-neutral-100 dark:border-noir-border hover:border-black dark:hover:border-white bg-neutral-50 dark:bg-noir-subtle hover:bg-white dark:hover:bg-noir-card transition-all group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-white dark:bg-noir-card border border-neutral-200 dark:border-noir-border text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-900 dark:text-white leading-tight">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {t.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                </a>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
            <span>Hours: Mon–Sat 10:00 – 19:00 IST</span>
            <a
              href="mailto:support@blancatelier.com"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Email fallback
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all group border border-neutral-800 dark:border-neutral-200"
        aria-label="Open WhatsApp Customer Care"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <MessageSquare className="w-4 h-4 text-emerald-400 dark:text-emerald-600 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-mono font-medium tracking-wider uppercase hidden sm:inline">
          WhatsApp Care
        </span>
      </button>
    </div>
  );
}
