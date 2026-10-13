import React from 'react';
import { X, Copy, Trash2, FolderHeart } from 'lucide-react';

export default function SavedDesignsDrawer({
  isOpen,
  onClose,
  savedDesigns,
  loading,
  currentDesignId,
  onLoadDesign,
  onDuplicateDesign,
  onDeleteDesign
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-noir-card h-full shadow-2xl flex flex-col border-l border-neutral-200 dark:border-noir-border">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-noir-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <h3 className="font-editorial text-lg font-semibold text-neutral-900 dark:text-white">
              My Saved Designs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Designs List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono animate-pulse text-neutral-500">
              Loading your saved designs...
            </div>
          ) : savedDesigns.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-neutral-400">
              <FolderHeart className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs">No saved designs yet.</p>
              <p className="text-[11px] text-neutral-500">
                Create a customized garment and click "Save Design" to store it in your atelier account.
              </p>
            </div>
          ) : (
            savedDesigns.map((d) => {
              const isCurrent = d.designId === currentDesignId;
              const thumbUrl = d.sides?.front?.previewImageUrl || d.previewThumbnailUrl;

              return (
                <div
                  key={d.designId}
                  className={`p-3 border rounded-lg transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-black dark:border-white bg-neutral-50 dark:bg-noir-subtle ring-1 ring-black dark:ring-white'
                      : 'border-neutral-200 dark:border-noir-border hover:border-neutral-400'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-16 bg-neutral-100 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={d.designName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] font-mono text-neutral-400">Preview</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                      {d.designName || 'Custom T-Shirt'}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {d.garmentStyle} • {d.selectedColor?.name || 'White'}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {new Date(d.updatedAt || d.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onLoadDesign(d)}
                      className="px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded hover:opacity-90"
                    >
                      {isCurrent ? 'Active' : 'Load'}
                    </button>
                    <button
                      onClick={() => onDuplicateDesign(d.designId)}
                      title="Duplicate"
                      className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDesign(d.designId)}
                      title="Delete"
                      className="p-1.5 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
