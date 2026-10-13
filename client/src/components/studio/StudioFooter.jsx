import React from 'react';
import { ShoppingBag, Bookmark, BookmarkCheck, FolderHeart } from 'lucide-react';
import { formatPrice } from '../../api/client';

export default function StudioFooter({
  designName,
  onChangeDesignName,
  unitPricePaise,
  quantity,
  isDoubleSided,
  hasPrint,
  saveLoading,
  onSaveDesign,
  onOpenSavedDesigns,
  onAddToCart,
  currentDesignId
}) {
  const totalPricePaise = unitPricePaise * quantity;

  return (
    <div className="bg-white dark:bg-noir-card border-t border-neutral-200 dark:border-noir-border p-4 sticky bottom-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Design Title & Saved Designs Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64">
            <input
              type="text"
              value={designName}
              onChange={(e) => onChangeDesignName(e.target.value)}
              placeholder="Design Title (e.g. Minimalist Core 01)"
              className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-noir-subtle border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-black"
            />
          </div>
          <button
            type="button"
            onClick={onOpenSavedDesigns}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-noir-border rounded text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white whitespace-nowrap"
          >
            <FolderHeart className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">My Designs</span>
          </button>
        </div>

        {/* Center: Authoritative Price Breakdown */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
              {isDoubleSided ? 'Double-Sided Print' : hasPrint ? 'Single-Sided Print' : 'Blank Garment'}
            </p>
            <p className="font-mono text-base font-bold text-neutral-900 dark:text-white">
              {formatPrice(totalPricePaise)}
              {quantity > 1 && (
                <span className="text-xs font-normal text-neutral-500 ml-1">
                  ({formatPrice(unitPricePaise)} × {quantity})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onSaveDesign(false)}
            disabled={saveLoading || !hasPrint}
            className="flex-1 md:flex-none px-4 py-2.5 border border-neutral-300 dark:border-noir-border rounded text-xs uppercase tracking-wider font-semibold text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{saveLoading ? 'Saving...' : currentDesignId ? 'Update Design' : 'Save Design'}</span>
          </button>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={!hasPrint}
            className="flex-1 md:flex-none px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Bag • {formatPrice(totalPricePaise)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
