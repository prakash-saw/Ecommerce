import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { GARMENT_STYLES, GARMENT_COLORS, SIZES } from './studioConstants';

export default function GarmentSelector({
  selectedStyle,
  onSelectStyle,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  quantity,
  onChangeQuantity
}) {
  const currentGarment = GARMENT_STYLES.find(s => s.id === selectedStyle) || GARMENT_STYLES[0];

  return (
    <div className="p-4 bg-white dark:bg-noir-card border-b border-neutral-200 dark:border-noir-border space-y-4">
      {/* Garment Style Selector */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
            Garment Silhouette
          </label>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            {currentGarment.badge}
          </span>
        </div>
        <select
          value={selectedStyle}
          onChange={(e) => onSelectStyle(e.target.value)}
          className="w-full p-2 bg-neutral-50 dark:bg-noir-subtle border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-black"
        >
          {GARMENT_STYLES.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} — {st.badge}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {currentGarment.description}
        </p>
      </div>

      {/* Colour Palette Swatches */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
            Fabric Colour
          </label>
          <span className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
            {selectedColor.name}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-0.5">
          {GARMENT_COLORS.map((col) => {
            const isSelected = selectedColor.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => onSelectColor(col)}
                title={col.name}
                className={`w-7 h-7 rounded-full border-2 transition-all relative ${
                  isSelected
                    ? 'scale-110 ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.hex, borderColor: col.border }}
              />
            );
          })}
        </div>
      </div>

      {/* Size and Quantity Controls */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Size Selection */}
        <div className="space-y-1">
          <label className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
            Size
          </label>
          <div className="flex items-center gap-1.5">
            {SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => onSelectSize(sz)}
                className={`w-8 h-8 rounded border font-mono text-xs font-semibold transition-colors ${
                  selectedSize === sz
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm'
                    : 'bg-neutral-50 dark:bg-noir-subtle text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
            Qty
          </label>
          <div className="flex items-center border border-neutral-300 dark:border-noir-border rounded overflow-hidden">
            <button
              onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-2.5 py-1.5 bg-neutral-100 dark:bg-noir-subtle hover:bg-neutral-200 text-xs font-bold disabled:opacity-30"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-mono font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => onChangeQuantity(Math.min(50, quantity + 1))}
              disabled={quantity >= 50}
              className="px-2.5 py-1.5 bg-neutral-100 dark:bg-noir-subtle hover:bg-neutral-200 text-xs font-bold disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
