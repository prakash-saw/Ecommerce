import React from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, RefreshCw, LayoutTemplate } from 'lucide-react';

export default function StudioToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  activeSide,
  onSelectSide,
  frontElementsCount,
  backElementsCount,
  showPrintGuides,
  onTogglePrintGuides,
  onResetCanvas
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-noir-card border-b border-neutral-200 dark:border-noir-border text-xs">
      {/* Undo, Redo & Reset */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle disabled:opacity-30 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:border-noir-border mx-1" />

        <button
          onClick={onResetCanvas}
          title="Reset canvas elements"
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle text-neutral-600 dark:text-neutral-400 hover:text-red-600 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Clear</span>
        </button>
      </div>

      {/* Front & Back Switcher with Indicators */}
      <div className="flex items-center bg-neutral-100 dark:bg-noir-subtle p-0.5 rounded-full border border-neutral-200 dark:border-noir-border font-medium">
        <button
          onClick={() => onSelectSide('front')}
          className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1.5 ${
            activeSide === 'front'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <span>Front</span>
          {frontElementsCount > 0 && (
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
              activeSide === 'front' ? 'bg-white/20 dark:bg-black/20' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}>
              {frontElementsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectSide('back')}
          className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1.5 ${
            activeSide === 'back'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <span>Back</span>
          {backElementsCount > 0 && (
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
              activeSide === 'back' ? 'bg-white/20 dark:bg-black/20' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}>
              {backElementsCount}
            </span>
          )}
        </button>
      </div>

      {/* Guides & Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePrintGuides}
          className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
            showPrintGuides
              ? 'bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white border-neutral-400 dark:border-neutral-500'
              : 'text-neutral-500 border-transparent hover:border-neutral-300'
          }`}
          title="Toggle print boundary guides"
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print Bounds</span>
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:border-noir-border mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.7}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle disabled:opacity-30 text-neutral-600 dark:text-neutral-400"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 w-9 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={zoomLevel >= 1.5}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle disabled:opacity-30 text-neutral-600 dark:text-neutral-400"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
