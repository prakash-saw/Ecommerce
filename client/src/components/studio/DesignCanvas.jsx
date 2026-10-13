import React from 'react';
import {
  Sliders, Copy, Trash2, Lock, Unlock,
  RotateCw, ZoomIn, Info
} from 'lucide-react';
import GarmentMockup from './GarmentMockup';

export default function DesignCanvas({
  selectedStyle,
  activeSide,
  selectedColor,
  zoomLevel,
  showPrintGuides,
  printableAreaRef,
  elements,
  selectedElementId,
  onSelectElement,
  onPointerDown,
  onDuplicateElement,
  onDeleteElement,
  onUpdateElement
}) {
  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Interactive Mockup Container */}
      <div
        className="relative w-full aspect-[4/5] bg-[#F7F7F4] dark:bg-noir-subtle border border-neutral-300 dark:border-noir-border rounded-b shadow-inner flex items-center justify-center overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Illustrative Canvas Notice (Requirement 4) */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm border border-neutral-200 dark:border-noir-border rounded text-[10px] text-neutral-600 dark:text-neutral-300 shadow-sm pointer-events-auto">
            <Info className="w-3 h-3 text-neutral-500 flex-shrink-0" />
            <span className="hidden sm:inline">Illustrative Studio Canvas — Interactive SVG preview for composition. Actual physical product will be crafted by workshop technicians.</span>
            <span className="sm:hidden">Illustrative SVG Preview</span>
          </div>
        </div>

        {/* Scaled Garment Silhouette & Elements Container */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Garment Mockup SVG */}
          <div className="w-[88%] h-[88%] flex items-center justify-center relative">
            <GarmentMockup
              style={selectedStyle}
              side={activeSide}
              colorHex={selectedColor.hex}
              className="w-full h-full"
            />

            {/* DEFINED 12" x 16" PRINTABLE BOUNDARY */}
            <div
              ref={printableAreaRef}
              className={`absolute w-[52%] h-[58%] top-[24%] left-1/2 -translate-x-1/2 rounded transition-all ${
                showPrintGuides
                  ? 'border-2 border-dashed border-blue-500/80 bg-blue-500/5 dark:bg-blue-500/10'
                  : 'border border-transparent'
              }`}
            >
              {showPrintGuides && (
                <div className="absolute -top-5 left-0 right-0 flex justify-between text-[8px] font-mono text-blue-600 dark:text-blue-400 font-semibold px-1">
                  <span>12" x 16" PRINTABLE AREA</span>
                  <span>300 DPI</span>
                </div>
              )}

              {/* Render Design Elements */}
              {elements.map((el) => {
                const isSelected = el.id === selectedElementId;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => onPointerDown(e, el)}
                    onTouchStart={(e) => onPointerDown(e, el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(el.id);
                    }}
                    className={`absolute select-none transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg'
                        : 'hover:ring-1 hover:ring-blue-300'
                    } ${el.isLocked ? 'cursor-not-allowed' : 'cursor-move'}`}
                    style={{
                      left: `${el.xPercent}%`,
                      top: `${el.yPercent}%`,
                      zIndex: el.zIndex || 1,
                      transform: `translate(-50%, -50%) scale(${el.scale || 1}) rotate(${el.rotation || 0}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    {/* ELEMENT TYPE: TEXT */}
                    {el.type === 'text' && (
                      <div
                        style={{
                          fontFamily: el.fontFamily,
                          fontSize: `${el.fontSize}px`,
                          color: el.colorHex,
                          textAlign: el.textAlign,
                          fontWeight: el.isBold ? 'bold' : 'normal',
                          fontStyle: el.isItalic ? 'italic' : 'normal',
                          letterSpacing: `${el.letterSpacing || 0}px`,
                          lineHeight: 1.15,
                          whiteSpace: 'pre-wrap'
                        }}
                        className="px-2 py-1 select-none pointer-events-none drop-shadow-sm"
                      >
                        {el.text}
                      </div>
                    )}

                    {/* ELEMENT TYPE: IMAGE */}
                    {el.type === 'image' && (
                      <img
                        src={el.imageUrl}
                        alt={el.originalFilename || 'Graphic'}
                        className="max-w-[210px] max-h-[230px] object-contain select-none pointer-events-none drop-shadow-sm"
                      />
                    )}

                    {/* ACTIVE BOUNDING CONTROLS FOR SELECTED ELEMENT */}
                    {isSelected && !el.isLocked && (
                      <div className="absolute -top-7 -right-2 flex items-center gap-1 bg-black text-white p-1 rounded shadow-md text-[10px] z-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateElement(el.id);
                          }}
                          className="hover:text-blue-400 p-0.5"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteElement(el.id);
                          }}
                          className="hover:text-red-400 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state hint */}
              {elements.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400 pointer-events-none">
                  <p className="font-editorial text-lg italic text-neutral-400">Empty Printable Area</p>
                  <p className="text-[11px] font-sans text-neutral-400 mt-1">
                    Use the sidebar to add typography, artwork, or atelier badges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEXTUAL TOOLBAR FOR ACTIVE ELEMENT */}
      {selectedElement && (
        <div className="w-full mt-3 bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border p-3 rounded text-xs space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-100 dark:border-noir-border">
            <span className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Active Element Controls</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white font-medium"
              >
                {selectedElement.isLocked ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Lock Position</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                <span>Scale</span>
                <span className="font-mono">{Math.round((selectedElement.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={selectedElement.scale || 1}
                disabled={selectedElement.isLocked}
                onChange={(e) => onUpdateElement(selectedElement.id, { scale: parseFloat(e.target.value) })}
                className="w-full accent-black dark:accent-white h-1.5 bg-neutral-200 dark:bg-noir-subtle rounded-lg"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                <span>Rotation</span>
                <span className="font-mono">{selectedElement.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedElement.rotation || 0}
                disabled={selectedElement.isLocked}
                onChange={(e) => onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-black dark:accent-white h-1.5 bg-neutral-200 dark:bg-noir-subtle rounded-lg"
              />
            </div>
          </div>

          {/* Alignment & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-noir-border text-[11px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateElement(selectedElement.id, { xPercent: 50 })}
                disabled={selectedElement.isLocked}
                className="px-2 py-1 border border-neutral-200 dark:border-noir-border rounded hover:border-black dark:hover:border-white"
              >
                Center Horizontally
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { yPercent: 50 })}
                disabled={selectedElement.isLocked}
                className="px-2 py-1 border border-neutral-200 dark:border-noir-border rounded hover:border-black dark:hover:border-white"
              >
                Center Vertically
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { rotation: 0 })}
                disabled={selectedElement.isLocked}
                className="px-2 py-1 border border-neutral-200 dark:border-noir-border rounded hover:border-black dark:hover:border-white flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Reset Angle
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onDuplicateElement(selectedElement.id)}
                className="px-2.5 py-1 border border-neutral-200 dark:border-noir-border rounded hover:border-black dark:hover:border-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Duplicate
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                className="px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
