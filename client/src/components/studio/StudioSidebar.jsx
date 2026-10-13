import React from 'react';
import {
  Type, Upload, Sparkles, LayoutTemplate, Layers,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Plus, AlertTriangle, Lock, Unlock, ArrowUp, ArrowDown, Trash2
} from 'lucide-react';
import {
  SUPPORTED_FONTS, PRINT_SAFE_PALETTE,
  CURATED_BADGES, TEMPLATE_CATEGORIES
} from './studioConstants';

export default function StudioSidebar({
  activeTab,
  onSelectTab,
  // Text state & actions
  inputText,
  onChangeInputText,
  selectedFont,
  onSelectFont,
  selectedTextColor,
  onSelectTextColor,
  fontSize,
  onChangeFontSize,
  textAlign,
  onSelectTextAlign,
  isBold,
  onToggleBold,
  isItalic,
  onToggleItalic,
  letterSpacing,
  onChangeLetterSpacing,
  onAddText,
  // Upload state & actions
  uploadLoading,
  uploadError,
  uploadWarning,
  fileInputRef,
  onFileUpload,
  // Graphic badges & templates
  onAddBadge,
  onApplyTemplate,
  // Layers state & actions
  activeSide,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onLayerOrder,
  onDeleteElement,
  onClearLayers
}) {
  const tabs = [
    { id: 'text', label: 'Text', icon: Type },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'graphics', label: 'Badges', icon: Sparkles },
    { id: 'template', label: 'Presets', icon: LayoutTemplate },
    { id: 'layers', label: 'Layers', icon: Layers, count: elements.length }
  ];

  return (
    <div className="bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border rounded shadow-sm overflow-hidden flex flex-col">
      {/* Sidebar Navigation Tabs */}
      <div className="grid grid-cols-5 border-b border-neutral-200 dark:border-noir-border bg-neutral-50 dark:bg-noir-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`py-3 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border-b-2 transition-colors relative ${
                isActive
                  ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-noir-card'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-[9px] flex items-center justify-center font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[560px]">
        {/* ========================================================
         * TAB 1: TEXT TOOL
         * ======================================================== */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Textarea Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Text Content
              </label>
              <textarea
                value={inputText}
                onChange={(e) => onChangeInputText(e.target.value)}
                rows={3}
                placeholder="Type your graphic text..."
                className="w-full p-2.5 bg-neutral-50 dark:bg-noir-subtle border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black font-medium resize-none"
              />
            </div>

            {/* Typography Family */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Typeface
              </label>
              <select
                value={selectedFont}
                onChange={(e) => onSelectFont(e.target.value)}
                className="w-full p-2 bg-neutral-50 dark:bg-noir-subtle border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black"
              >
                {SUPPORTED_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Styling Toolbar: Bold, Italic, Alignment */}
            <div className="flex items-center justify-between gap-2 border border-neutral-200 dark:border-noir-border p-1 rounded bg-neutral-50 dark:bg-noir-subtle">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleBold}
                  className={`p-1.5 rounded transition-colors ${
                    isBold ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleItalic}
                  className={`p-1.5 rounded transition-colors ${
                    isItalic ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-noir-border pl-2">
                {[
                  { id: 'left', icon: AlignLeft },
                  { id: 'center', icon: AlignCenter },
                  { id: 'right', icon: AlignRight }
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelectTextAlign(a.id)}
                      className={`p-1.5 rounded transition-colors ${
                        textAlign === a.id
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size & Letter Spacing Sliders */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>Font Size</span>
                  <span className="font-mono">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="90"
                  value={fontSize}
                  onChange={(e) => onChangeFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-black dark:accent-white h-1.5 bg-neutral-200 dark:bg-noir-subtle rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>Letter Spacing</span>
                  <span className="font-mono">{letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={letterSpacing}
                  onChange={(e) => onChangeLetterSpacing(parseInt(e.target.value, 10))}
                  className="w-full accent-black dark:accent-white h-1.5 bg-neutral-200 dark:bg-noir-subtle rounded-lg"
                />
              </div>
            </div>

            {/* Print Safe Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Print Ink Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {PRINT_SAFE_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    type="button"
                    onClick={() => onSelectTextColor(pal.hex)}
                    title={pal.name}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedTextColor === pal.hex
                        ? 'scale-125 ring-2 ring-black dark:ring-white ring-offset-1'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: pal.hex, borderColor: '#D4D4D8' }}
                  />
                ))}
              </div>
            </div>

            {/* Add Text to Canvas Button */}
            <button
              type="button"
              onClick={onAddText}
              className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Text to {activeSide.toUpperCase()}</span>
            </button>
          </div>
        )}

        {/* ========================================================
         * TAB 2: UPLOAD ARTWORK (Strict validation & DPI indicator)
         * ======================================================== */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-noir-border hover:border-black dark:hover:border-white p-6 rounded text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-noir-subtle"
            >
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Click to upload artwork
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                PNG, JPEG, WebP • Max 15MB • Min 400x400px
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
            </div>

            {uploadLoading && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono animate-pulse text-center">
                Validating resolution and processing file...
              </p>
            )}

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadWarning}</span>
              </div>
            )}

            <div className="p-3 bg-neutral-100 dark:bg-noir-subtle rounded text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">Print Quality Guidelines:</p>
              <p>• Transparent PNG delivers crisp edge isolation on garments.</p>
              <p>• Recommended resolution: 300 DPI (1800x2400px minimum) for gallery-grade reproduction.</p>
            </div>
          </div>
        )}

        {/* ========================================================
         * TAB 3: CURATED BADGES
         * ======================================================== */}
        {activeTab === 'graphics' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Select vector streetwear graphics and atelier stamps:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CURATED_BADGES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onAddBadge(b)}
                  className="p-3 border border-neutral-200 dark:border-noir-border rounded text-center hover:border-black dark:hover:border-white bg-neutral-50/60 dark:bg-noir-subtle hover:bg-white transition-all flex flex-col items-center justify-between gap-2"
                >
                  <div className="h-16 w-full flex items-center justify-center overflow-hidden">
                    <img src={b.svgUrl} alt={b.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 uppercase tracking-wider line-clamp-1">
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
         * TAB 4: CURATED TEMPLATES
         * ======================================================== */}
        {activeTab === 'template' && (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold tracking-wider">
                  {cat.name}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {cat.templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => onApplyTemplate(tpl)}
                      className="p-3 border border-neutral-200 dark:border-noir-border rounded text-left hover:border-black dark:hover:border-white bg-neutral-50/50 dark:bg-noir-subtle hover:bg-white transition-all group"
                    >
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                        {tpl.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-1 whitespace-pre-line line-clamp-2">
                        {tpl.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================
         * TAB 5: LAYERS MANAGEMENT
         * ======================================================== */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Layers on {activeSide.toUpperCase()} ({elements.length})
              </span>
              {elements.length > 0 && (
                <button
                  onClick={onClearLayers}
                  className="text-red-600 hover:underline text-[11px]"
                >
                  Clear All
                </button>
              )}
            </div>

            {elements.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No elements on {activeSide} view yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {elements.map((el, idx) => (
                  <div
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`p-2.5 border rounded flex items-center justify-between text-xs cursor-pointer transition-all ${
                      selectedElementId === el.id
                        ? 'border-black dark:border-white bg-neutral-50 dark:bg-noir-subtle ring-1 ring-black dark:ring-white shadow-sm'
                        : 'border-neutral-200 dark:border-noir-border hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-neutral-400">#{idx + 1}</span>
                      {el.type === 'text' ? (
                        <Type className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300 flex-shrink-0" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300 flex-shrink-0" />
                      )}
                      <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                        {el.type === 'text' ? el.text.replace(/\n/g, ' ') : el.originalFilename || 'Artwork Image'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateElement(el.id, { isLocked: !el.isLocked });
                        }}
                        className="p-1 text-neutral-500 hover:text-black dark:hover:text-white"
                        title={el.isLocked ? 'Unlock' : 'Lock'}
                      >
                        {el.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerOrder(el.id, 'up');
                        }}
                        className="p-1 text-neutral-500 hover:text-black dark:hover:text-white"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerOrder(el.id, 'down');
                        }}
                        className="p-1 text-neutral-500 hover:text-black dark:hover:text-white"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
