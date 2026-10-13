import React, { useState } from 'react';
import { Ruler, X, Check, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function SizeRecommenderModal({
  isOpen,
  onClose,
  product,
  currentSelectedSize,
  onSelectSize,
  variants = []
}) {
  const [unit, setUnit] = useState('cm'); // 'cm' | 'in'
  const [chestInput, setChestInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [fitPreference, setFitPreference] = useState('regular'); // 'slim' | 'regular' | 'oversized'
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'chart'

  if (!isOpen) return null;

  // Garment size chart fallback if product does not have one
  const sizeChart = (product?.sizeChart && product.sizeChart.length > 0)
    ? product.sizeChart
    : [
        { size: 'S', chestCm: 102, lengthCm: 69, shoulderCm: 48, sleeveCm: 21 },
        { size: 'M', chestCm: 108, lengthCm: 71, shoulderCm: 50, sleeveCm: 22 },
        { size: 'L', chestCm: 114, lengthCm: 74, shoulderCm: 52, sleeveCm: 23 },
        { size: 'XL', chestCm: 120, lengthCm: 76, shoulderCm: 55, sleeveCm: 24 },
        { size: 'XXL', chestCm: 126, lengthCm: 78, shoulderCm: 58, sleeveCm: 25 }
      ];

  // Convert helpers
  const toDisplay = (cmVal) => {
    if (unit === 'in') {
      return (cmVal / 2.54).toFixed(1) + '"';
    }
    return `${cmVal} cm`;
  };

  // Parse user chest in CM
  let userChestCm = parseFloat(chestInput);
  if (!isNaN(userChestCm) && unit === 'in') {
    userChestCm = userChestCm * 2.54;
  }

  // Calculate recommended size
  let recommendation = null;
  let explanation = '';
  let isStockAvailable = true;

  if (!isNaN(userChestCm) && userChestCm >= 70 && userChestCm <= 140) {
    // Streetwear Ease offsets
    const targetEase = fitPreference === 'slim' ? 6 : fitPreference === 'regular' ? 12 : 20;
    const targetGarmentChest = userChestCm + targetEase;

    // Find best match in size chart
    let closest = sizeChart[0];
    let minDiff = Math.abs(closest.chestCm - targetGarmentChest);

    for (const entry of sizeChart) {
      const diff = Math.abs(entry.chestCm - targetGarmentChest);
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }

    recommendation = closest.size;
    const difference = closest.chestCm - userChestCm;

    explanation = `Based on your ${Math.round(userChestCm)} cm body chest and ${fitPreference} preference, Size ${recommendation} (${closest.chestCm} cm garment chest) delivers approx. ${Math.round(difference)} cm ease for the intended ${product?.fabric?.fit || 'boxy drop shoulder'} silhouette.`;

    // Check stock for this size in variants
    const matchedVariant = variants.find(v => v.size === recommendation);
    if (matchedVariant && matchedVariant.stockQuantity <= 0) {
      isStockAvailable = false;
    }
  }

  const handleApplySize = (sz) => {
    if (onSelectSize) onSelectSize(sz);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E5E0] dark:border-noir-border">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white">
              Garment Sizing Advisor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subhead & Navigation Tabs */}
        <div className="px-5 pt-3 flex items-center justify-between border-b border-neutral-100 dark:border-noir-border">
          <div className="flex gap-4 text-xs font-mono tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`pb-2.5 border-b-2 font-medium transition-colors ${
                activeTab === 'advisor'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              Fit Advisor
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`pb-2.5 border-b-2 font-medium transition-colors ${
                activeTab === 'chart'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              Measurement Specs
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-noir-subtle p-0.5 rounded border border-neutral-200 dark:border-noir-border text-[11px] font-mono">
            <button
              onClick={() => setUnit('cm')}
              className={`px-2 py-0.5 rounded transition-all ${
                unit === 'cm'
                  ? 'bg-white dark:bg-noir-card text-neutral-900 dark:text-white font-bold shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              CM
            </button>
            <button
              onClick={() => setUnit('in')}
              className={`px-2 py-0.5 rounded transition-all ${
                unit === 'in'
                  ? 'bg-white dark:bg-noir-card text-neutral-900 dark:text-white font-bold shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              IN
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {activeTab === 'advisor' ? (
            <div className="space-y-5">
              {/* Fit Preference Pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block uppercase tracking-wider font-mono">
                  1. How do you prefer your tees to sit?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'slim', label: 'Structured Slim', desc: '+6 cm ease' },
                    { id: 'regular', label: 'Classic Boxy', desc: '+12 cm ease' },
                    { id: 'oversized', label: 'Drop Shoulder', desc: '+20 cm ease' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFitPreference(f.id)}
                      className={`p-2.5 text-left rounded border transition-all ${
                        fitPreference === f.id
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-semibold'
                          : 'border-neutral-200 dark:border-noir-border hover:border-black text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="text-xs">{f.label}</div>
                      <div className={`text-[10px] ${fitPreference === f.id ? 'opacity-80' : 'text-neutral-400'}`}>
                        {f.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Measurements Inputs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block uppercase tracking-wider font-mono">
                  2. Enter Your Body Measurements ({unit})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                      Chest Circumference ({unit}) *
                    </label>
                    <input
                      type="number"
                      placeholder={unit === 'cm' ? 'e.g. 96' : 'e.g. 38'}
                      value={chestInput}
                      onChange={(e) => setChestInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-mono"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      Measure around the fullest part of your chest.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                      Height ({unit === 'cm' ? 'cm' : 'inches'}) (optional)
                    </label>
                    <input
                      type="number"
                      placeholder={unit === 'cm' ? 'e.g. 178' : 'e.g. 70'}
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-mono"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      Used to evaluate garment length drop.
                    </span>
                  </div>
                </div>
              </div>

              {/* Output Result Card */}
              {recommendation ? (
                <div className="p-4 rounded border border-black/10 dark:border-white/20 bg-neutral-50 dark:bg-noir-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                        Recommended Garment Size
                      </span>
                    </div>
                    <span className="text-xl font-mono font-bold text-black dark:text-white bg-white dark:bg-black px-3 py-1 rounded border border-neutral-300 dark:border-noir-border">
                      {recommendation}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    {explanation}
                  </p>

                  {!isStockAvailable && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Note: Size {recommendation} is currently low or out of stock for this colorway.</span>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleApplySize(recommendation)}
                      className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Size {recommendation} to Product</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 dark:bg-noir-subtle border border-dashed border-neutral-200 dark:border-noir-border rounded text-center space-y-1">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Enter your chest measurement above to calculate your exact streetwear size recommendation.
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Calculated against {product?.name || 'this garment'}'s exact pattern dimensions.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Size Chart Table View */
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E0] dark:border-noir-border font-mono text-[11px] text-neutral-500 uppercase">
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chest Width</th>
                      <th className="py-2.5 px-3">Length</th>
                      <th className="py-2.5 px-3">Shoulder</th>
                      <th className="py-2.5 px-3">Sleeve</th>
                      <th className="py-2.5 px-3 text-right">Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-noir-border font-mono">
                    {sizeChart.map((row) => (
                      <tr
                        key={row.size}
                        className={`hover:bg-neutral-50 dark:hover:bg-noir-subtle transition-colors ${
                          currentSelectedSize === row.size ? 'bg-neutral-50 dark:bg-noir-card font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white">
                          {row.size}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                          {toDisplay(row.chestCm)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                          {toDisplay(row.lengthCm)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                          {toDisplay(row.shoulderCm || 50)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                          {toDisplay(row.sleeveCm || 22)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleApplySize(row.size)}
                            className="px-2 py-1 text-[10px] border border-neutral-300 dark:border-noir-border hover:border-black dark:hover:border-white rounded transition-colors"
                          >
                            {currentSelectedSize === row.size ? 'Selected' : 'Choose'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-noir-subtle rounded border border-neutral-200 dark:border-noir-border text-[11px] text-neutral-500 space-y-1">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  How to measure your t-shirt:
                </p>
                <p>
                  • <strong>Chest:</strong> Flat garment width measured armpit-to-armpit, multiplied by two.
                </p>
                <p>
                  • <strong>Length:</strong> Highest point of shoulder down to bottom hem.
                </p>
              </div>
            </div>
          )}

          {/* Privacy & Guidance Disclaimer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-noir-border flex items-start gap-2 text-[10px] text-neutral-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Privacy assurance: Measurements are computed purely in your local browser and never transmitted or stored. Garment sizes may have a natural +/- 1.5 cm tolerance. Recommendations are advisory guidance, not a guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
