import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import {
  GARMENT_STYLES,
  GARMENT_COLORS,
  SIZES,
  SUPPORTED_FONTS,
  PRINT_SAFE_PALETTE
} from '../components/studio/studioConstants';

import StudioToolbar from '../components/studio/StudioToolbar';
import GarmentSelector from '../components/studio/GarmentSelector';
import DesignCanvas from '../components/studio/DesignCanvas';
import StudioSidebar from '../components/studio/StudioSidebar';
import SavedDesignsDrawer from '../components/studio/SavedDesignsDrawer';
import StudioFooter from '../components/studio/StudioFooter';

export default function CustomizeStudioPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Garment & Variants State
  const [selectedStyle, setSelectedStyle] = useState(GARMENT_STYLES[0].id);
  const [selectedColor, setSelectedColor] = useState(GARMENT_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'

  // Product Reference & Design ID
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [designName, setDesignName] = useState('Custom T-Shirt Design');

  // Multi-Side Elements State
  const [sides, setSides] = useState({
    front: { enabled: true, elements: [] },
    back: { enabled: false, elements: [] }
  });

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Active Selected Element
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Sidebar Tool Tab: 'text' | 'upload' | 'graphics' | 'template' | 'layers'
  const [activeTab, setActiveTab] = useState('text');

  // Text Tool Controls
  const [inputText, setInputText] = useState('BLANC\nATELIER');
  const [selectedFont, setSelectedFont] = useState(SUPPORTED_FONTS[0].id);
  const [selectedTextColor, setSelectedTextColor] = useState(PRINT_SAFE_PALETTE[0].hex);
  const [fontSize, setFontSize] = useState(32);
  const [textAlign, setTextAlign] = useState('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);

  // Upload State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');
  const fileInputRef = useRef(null);

  // Canvas Viewport & Guides
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);

  // Drawers & Modals
  const [showSavedDesignsDrawer, setShowSavedDesignsDrawer] = useState(false);
  const [savedDesignsList, setSavedDesignsList] = useState([]);
  const [savedDesignsLoading, setSavedDesignsLoading] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Drag-and-Drop References
  const printableAreaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    elementId: null,
    startX: 0,
    startY: 0,
    elemStartX: 0,
    elemStartY: 0
  });

  const showStatus = (message, type = 'success') => {
    setStatusNotification({ message, type });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4000);
  };

  // Push Snapshot to History Stack
  const saveToHistory = useCallback((newSides) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, JSON.parse(JSON.stringify(newSides))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Load Initial Product if specified in URL
  useEffect(() => {
    if (productId) {
      apiRequest(`/products/${productId}`)
        .then((res) => {
          if (res.success && res.product) {
            setCurrentProduct(res.product);
          }
        })
        .catch((err) => console.warn('Could not load product details:', err));
    }
  }, [productId]);

  // Restore Pending Design from LocalStorage if Returning from Auth Redirect
  useEffect(() => {
    const savedPending = localStorage.getItem('blanc_studio_pending_design');
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed.selectedStyle) setSelectedStyle(parsed.selectedStyle);
        if (parsed.selectedColor) setSelectedColor(parsed.selectedColor);
        if (parsed.selectedSize) setSelectedSize(parsed.selectedSize);
        if (parsed.sides) setSides(parsed.sides);
        if (parsed.designName) setDesignName(parsed.designName);
        if (parsed.currentDesignId) setCurrentDesignId(parsed.currentDesignId);
        localStorage.removeItem('blanc_studio_pending_design');
        showStatus('Restored your draft design session!', 'success');
      } catch (e) {
        console.warn('Failed restoring draft session:', e);
      }
    }
  }, []);

  // Initialize History with Initial State
  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(sides))]);
      setHistoryIndex(0);
    }
  }, [sides, history.length]);

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSides(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSides(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
      setSelectedElementId(null);
    }
  };

  // Update Elements on Active Side
  const updateActiveElements = (updater) => {
    setSides((prev) => {
      const currentList = prev[activeSide].elements;
      const updatedList = typeof updater === 'function' ? updater(currentList) : updater;
      const nextSides = {
        ...prev,
        [activeSide]: {
          ...prev[activeSide],
          enabled: updatedList.length > 0 || prev[activeSide].enabled,
          elements: updatedList
        }
      };
      saveToHistory(nextSides);
      return nextSides;
    });
  };

  // Add Custom Text Element
  const handleAddText = () => {
    if (!inputText.trim()) return;

    const newElement = {
      id: `el_txt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'text',
      text: inputText,
      fontFamily: selectedFont,
      fontSize: fontSize,
      colorHex: selectedTextColor,
      textAlign: textAlign,
      isBold: isBold,
      isItalic: isItalic,
      letterSpacing: letterSpacing,
      xPercent: 50,
      yPercent: 45,
      rotation: 0,
      scale: 1,
      isLocked: false,
      zIndex: (sides[activeSide].elements.length || 0) + 1
    };

    updateActiveElements((list) => [...list, newElement]);
    setSelectedElementId(newElement.id);
    showStatus('Text added to garment!', 'success');
  };

  // File Upload Handler (Validated for Format, Size, & Resolution)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadWarning('');
    setUploadLoading(true);

    try {
      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        throw new Error('Unsupported format. Please select PNG, JPEG, or WebP.');
      }
      if (file.size > 15 * 1024 * 1024) {
        throw new Error('File exceeds 15MB maximum print upload limit.');
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      const dimensions = await new Promise((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
        img.src = objectUrl;
      });

      if (dimensions.width < 400 || dimensions.height < 400) {
        setUploadWarning('Image is below recommended 400x400px. Print quality may be pixelated.');
      }

      const formData = new FormData();
      formData.append('artwork', file);
      formData.append('width', dimensions.width);
      formData.append('height', dimensions.height);

      const res = await apiRequest('/designs/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.success) {
        throw new Error(res.message || 'Artwork upload failed.');
      }

      if (res.warnings && res.warnings.length > 0) {
        setUploadWarning(res.warnings[0]);
      }

      const newElement = {
        id: `el_img_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'image',
        imageUrl: res.url,
        assetId: res.assetId,
        originalFilename: res.originalFilename,
        estimatedDpi: res.estimatedDpi,
        xPercent: 50,
        yPercent: 45,
        rotation: 0,
        scale: 1,
        isLocked: false,
        zIndex: (sides[activeSide].elements.length || 0) + 1
      };

      updateActiveElements((list) => [...list, newElement]);
      setSelectedElementId(newElement.id);
      showStatus(`Image uploaded (~${res.estimatedDpi || 300} DPI estimated resolution)`, 'success');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload artwork');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Curated Graphic Badge
  const handleAddBadge = (badge) => {
    const newElement = {
      id: `el_bdg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'image',
      imageUrl: badge.svgUrl,
      originalFilename: badge.name,
      xPercent: 50,
      yPercent: 45,
      rotation: 0,
      scale: 1,
      isLocked: false,
      zIndex: (sides[activeSide].elements.length || 0) + 1
    };

    updateActiveElements((list) => [...list, newElement]);
    setSelectedElementId(newElement.id);
    showStatus(`Added "${badge.name}" badge!`, 'success');
  };

  // Apply Typography Template Preset
  const handleApplyTemplate = (tpl) => {
    const newElement = {
      id: `el_tpl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'text',
      text: tpl.text,
      fontFamily: tpl.font,
      fontSize: tpl.size,
      colorHex: tpl.color,
      textAlign: 'center',
      isBold: !!tpl.isBold,
      isItalic: !!tpl.isItalic,
      letterSpacing: 1,
      xPercent: 50,
      yPercent: 45,
      rotation: 0,
      scale: 1,
      isLocked: false,
      zIndex: (sides[activeSide].elements.length || 0) + 1
    };

    updateActiveElements((list) => [...list, newElement]);
    setSelectedElementId(newElement.id);
    showStatus(`Applied "${tpl.name}" typography preset!`, 'success');
  };

  // Duplicate Selected Element
  const handleDuplicateElement = (elementId) => {
    const currentList = sides[activeSide].elements;
    const el = currentList.find(item => item.id === elementId);
    if (!el) return;

    const duplicated = {
      ...JSON.parse(JSON.stringify(el)),
      id: `el_dup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      xPercent: Math.min(85, el.xPercent + 5),
      yPercent: Math.min(85, el.yPercent + 5),
      zIndex: currentList.length + 1
    };

    updateActiveElements((list) => [...list, duplicated]);
    setSelectedElementId(duplicated.id);
  };

  // Delete Element
  const handleDeleteElement = (elementId) => {
    updateActiveElements((list) => list.filter(item => item.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Update Single Element Attribute
  const handleUpdateElement = (elementId, updates) => {
    updateActiveElements((list) =>
      list.map(item => (item.id === elementId ? { ...item, ...updates } : item))
    );
  };

  // Layer Reordering (Bring Forward / Send Backward)
  const handleLayerOrder = (elementId, direction) => {
    const list = [...sides[activeSide].elements];
    const index = list.findIndex(el => el.id === elementId);
    if (index === -1) return;

    if (direction === 'up' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    }

    const reIndexed = list.map((item, idx) => ({ ...item, zIndex: idx + 1 }));
    updateActiveElements(reIndexed);
  };

  // Pointer Down (Initiates Dragging)
  const handlePointerDown = (e, element) => {
    if (element.isLocked) return;
    e.stopPropagation();

    setSelectedElementId(element.id);
    setIsDragging(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      elementId: element.id,
      startX: clientX,
      startY: clientY,
      elemStartX: element.xPercent,
      elemStartY: element.yPercent
    };
  };

  // Pointer Move (Calculates Normalized Percentage Coordinates)
  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !dragRef.current.elementId || !printableAreaRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = printableAreaRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, dragRef.current.elemStartX + deltaXPercent));
    const newY = Math.max(5, Math.min(95, dragRef.current.elemStartY + deltaYPercent));

    setSides((prevSides) => {
      const currentList = prevSides[activeSide].elements.map((el) => {
        if (el.id === dragRef.current.elementId) {
          return { ...el, xPercent: Math.round(newX * 10) / 10, yPercent: Math.round(newY * 10) / 10 };
        }
        return el;
      });

      return {
        ...prevSides,
        [activeSide]: { ...prevSides[activeSide], elements: currentList }
      };
    });
  }, [isDragging, activeSide]);

  // Pointer Up (Ends Dragging and Records to History)
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current.elementId = null;
      saveToHistory(sides);
    }
  }, [isDragging, sides, saveToHistory]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Price Calculation Breakdown
  const garmentConfig = GARMENT_STYLES.find(s => s.id === selectedStyle) || GARMENT_STYLES[0];
  const hasFrontPrint = sides.front.enabled && sides.front.elements.length > 0;
  const hasBackPrint = sides.back.enabled && sides.back.elements.length > 0;
  const isDoubleSided = hasFrontPrint && hasBackPrint;
  const baseCost = garmentConfig.basePricePaise;
  const printCost = isDoubleSided ? 45000 : (hasFrontPrint || hasBackPrint ? 25000 : 0);
  const calculatedUnitPrice = baseCost + printCost;

  // Save Design Handler (Secured with Ownership & Auth Preservation)
  const handleSaveDesign = async (saveAsNew = false) => {
    if (!hasFrontPrint && !hasBackPrint) {
      alert('Please add at least one design element to the garment before saving.');
      return;
    }

    if (!user) {
      const pendingData = {
        selectedStyle,
        selectedColor,
        selectedSize,
        sides,
        designName,
        currentDesignId
      };
      localStorage.setItem('blanc_studio_pending_design', JSON.stringify(pendingData));
      navigate('/account?mode=login&redirect=/customize&notice=auth_required');
      return;
    }

    try {
      setSaveLoading(true);
      const targetDesignId = saveAsNew ? null : currentDesignId;

      const payload = {
        designId: targetDesignId,
        designName: designName.trim(),
        garmentStyle: selectedStyle,
        productId: currentProduct?._id,
        selectedColor: { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex },
        selectedSize: selectedSize,
        sides: sides,
        saveAsNew: saveAsNew
      };

      const res = await apiRequest('/designs/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setCurrentDesignId(res.designId);
        showStatus(`Design "${res.designName}" saved to your account!`, 'success');
      } else {
        throw new Error(res.message || 'Could not save design.');
      }
    } catch (err) {
      alert(err.message || 'Failed to save design');
    } finally {
      setSaveLoading(false);
    }
  };

  // Load Saved Designs from Account
  const handleOpenMySavedDesigns = async () => {
    if (!user) {
      navigate('/account?mode=login&redirect=/customize&notice=auth_required');
      return;
    }
    setShowSavedDesignsDrawer(true);
    setSavedDesignsLoading(true);
    try {
      const res = await apiRequest('/designs/my-designs');
      if (res.success) {
        setSavedDesignsList(res.designs || []);
      }
    } catch (err) {
      console.warn('Could not load saved designs:', err);
    } finally {
      setSavedDesignsLoading(false);
    }
  };

  const handleLoadDesign = (designRecord) => {
    if (designRecord.garmentStyle) setSelectedStyle(designRecord.garmentStyle);
    if (designRecord.selectedColor) setSelectedColor(designRecord.selectedColor);
    if (designRecord.selectedSize) setSelectedSize(designRecord.selectedSize);
    if (designRecord.sides) setSides(designRecord.sides);
    if (designRecord.designName) setDesignName(designRecord.designName);
    setCurrentDesignId(designRecord.designId);
    setShowSavedDesignsDrawer(false);
    showStatus(`Loaded "${designRecord.designName}"`, 'success');
  };

  const handleDuplicateDesignRecord = async (designId) => {
    try {
      const res = await apiRequest(`/designs/${designId}/duplicate`, { method: 'POST' });
      if (res.success) {
        setSavedDesignsList((prev) => [res.design, ...prev]);
        showStatus('Design duplicated!', 'success');
      }
    } catch (err) {
      alert(err.message || 'Failed to duplicate design');
    }
  };

  const handleDeleteDesignRecord = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this saved design?')) return;
    try {
      const res = await apiRequest(`/designs/${designId}`, { method: 'DELETE' });
      if (res.success) {
        setSavedDesignsList((prev) => prev.filter(d => d.designId !== designId));
        if (currentDesignId === designId) {
          setCurrentDesignId(null);
        }
        showStatus('Design deleted from account', 'success');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete design');
    }
  };

  // Add Custom Item to Cart with Server Verification
  const handleAddToCart = async () => {
    if (!hasFrontPrint && !hasBackPrint) {
      alert('Please add at least one design element before adding to cart.');
      return;
    }

    try {
      let activeId = currentDesignId;
      // Ensure design is saved to DB before attaching to cart
      const saveRes = await apiRequest('/designs/save', {
        method: 'POST',
        body: JSON.stringify({
          designId: activeId,
          designName: designName.trim(),
          garmentStyle: selectedStyle,
          productId: currentProduct?._id,
          selectedColor: { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex },
          selectedSize: selectedSize,
          sides: sides
        })
      });

      if (!saveRes.success) {
        throw new Error(saveRes.message || 'Could not verify custom design.');
      }
      activeId = saveRes.designId;
      setCurrentDesignId(activeId);

      const cartItemPayload = {
        productId: currentProduct?._id || saveRes.productId,
        customDesignId: activeId,
        designVersion: saveRes.version || 1,
        selectedSize: selectedSize,
        selectedColor: { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex },
        quantity: quantity,
        isCustom: true,
        printLocations: isDoubleSided ? ['front', 'back'] : [activeSide],
        productName: `Custom ${selectedStyle} — "${designName}"`,
        previewImageUrl: sides.front.previewImageUrl || sides.front.elements[0]?.imageUrl || ''
      };

      await addToCart(cartItemPayload);
      showStatus(`Added ${quantity} custom ${selectedStyle} to bag!`, 'success');
    } catch (err) {
      alert(err.message || 'Failed to add custom garment to cart');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-noir-bg flex flex-col justify-between">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed top-16 right-4 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <span>{statusNotification.message}</span>
        </div>
      )}

      {/* Studio Header Toolbar */}
      <StudioToolbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
        onZoomOut={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))}
        activeSide={activeSide}
        onSelectSide={(side) => {
          setActiveSide(side);
          setSelectedElementId(null);
        }}
        frontElementsCount={sides.front.elements.length}
        backElementsCount={sides.back.elements.length}
        showPrintGuides={showPrintGuides}
        onTogglePrintGuides={() => setShowPrintGuides(!showPrintGuides)}
        onResetCanvas={() => setShowResetConfirmModal(true)}
      />

      {/* Main Studio Interactive Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Garment Configuration & Variant Specs (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GarmentSelector
              selectedStyle={selectedStyle}
              onSelectStyle={setSelectedStyle}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              quantity={quantity}
              onChangeQuantity={setQuantity}
            />

            <StudioSidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              inputText={inputText}
              onChangeInputText={setInputText}
              selectedFont={selectedFont}
              onSelectFont={setSelectedFont}
              selectedTextColor={selectedTextColor}
              onSelectTextColor={setSelectedTextColor}
              fontSize={fontSize}
              onChangeFontSize={setFontSize}
              textAlign={textAlign}
              onSelectTextAlign={setTextAlign}
              isBold={isBold}
              onToggleBold={() => setIsBold(!isBold)}
              isItalic={isItalic}
              onToggleItalic={() => setIsItalic(!isItalic)}
              letterSpacing={letterSpacing}
              onChangeLetterSpacing={setLetterSpacing}
              onAddText={handleAddText}
              uploadLoading={uploadLoading}
              uploadError={uploadError}
              uploadWarning={uploadWarning}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onAddBadge={handleAddBadge}
              onApplyTemplate={handleApplyTemplate}
              activeSide={activeSide}
              elements={sides[activeSide]?.elements || []}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onLayerOrder={handleLayerOrder}
              onDeleteElement={handleDeleteElement}
              onClearLayers={() => setShowResetConfirmModal(true)}
            />
          </div>

          {/* CENTER: Interactive Garment Canvas & Element Bounding (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <DesignCanvas
              selectedStyle={selectedStyle}
              activeSide={activeSide}
              selectedColor={selectedColor}
              zoomLevel={zoomLevel}
              showPrintGuides={showPrintGuides}
              printableAreaRef={printableAreaRef}
              elements={sides[activeSide]?.elements || []}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onPointerDown={handlePointerDown}
              onDuplicateElement={handleDuplicateElement}
              onDeleteElement={handleDeleteElement}
              onUpdateElement={handleUpdateElement}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action & Authoritative Price Summary Bar */}
      <StudioFooter
        designName={designName}
        onChangeDesignName={setDesignName}
        unitPricePaise={calculatedUnitPrice}
        quantity={quantity}
        isDoubleSided={isDoubleSided}
        hasPrint={hasFrontPrint || hasBackPrint}
        saveLoading={saveLoading}
        onSaveDesign={handleSaveDesign}
        onOpenSavedDesigns={handleOpenMySavedDesigns}
        onAddToCart={handleAddToCart}
        currentDesignId={currentDesignId}
      />

      {/* Customer Saved Designs Drawer */}
      <SavedDesignsDrawer
        isOpen={showSavedDesignsDrawer}
        onClose={() => setShowSavedDesignsDrawer(false)}
        savedDesigns={savedDesignsList}
        loading={savedDesignsLoading}
        currentDesignId={currentDesignId}
        onLoadDesign={handleLoadDesign}
        onDuplicateDesign={handleDuplicateDesignRecord}
        onDeleteDesign={handleDeleteDesignRecord}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-noir-card p-6 rounded-lg max-w-sm w-full space-y-4 border border-neutral-200 dark:border-noir-border shadow-2xl">
            <h4 className="font-editorial text-lg font-semibold text-neutral-900 dark:text-white">
              Clear Canvas Elements?
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              This will remove all text and graphic elements from the active {activeSide} view. This action can be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-noir-border text-xs rounded hover:border-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateActiveElements([]);
                  setShowResetConfirmModal(false);
                  setSelectedElementId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700"
              >
                Clear Elements
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
