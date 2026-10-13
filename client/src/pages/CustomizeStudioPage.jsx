import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Upload, Type, LayoutTemplate, ZoomIn, ZoomOut,
  Undo2, Redo2, RefreshCw, AlertTriangle, Check,
  ShoppingBag, Sliders, Sparkles, Layers,
  Trash2, Copy, Lock, Unlock, ArrowUp, ArrowDown, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Save, Bookmark, X,
  FolderHeart, Plus, Info
} from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import GarmentMockup from '../components/studio/GarmentMockup';

// 10 Real Garment Categories with Specifications
const GARMENT_STYLES = [
  {
    id: 'Oversized T-Shirt',
    name: 'Oversized T-Shirt',
    badge: 'Signature Cut',
    description: '240 GSM French Terry Cotton • Drop Shoulder Boxy Fit',
    basePricePaise: 89900
  },
  {
    id: 'Regular Fit T-Shirt',
    name: 'Regular Fit T-Shirt',
    badge: 'Classic Fit',
    description: '220 GSM Combed Cotton • Tailored Standard Fit',
    basePricePaise: 79900
  },
  {
    id: 'Polo T-Shirt',
    name: 'Polo T-Shirt',
    badge: 'Smart Casual',
    description: '230 GSM Pique Knit • Turn-down Ribbed Collar & Placket',
    basePricePaise: 99900
  },
  {
    id: 'Classic Round-Neck T-Shirt',
    name: 'Classic Round-Neck T-Shirt',
    badge: 'Essential',
    description: '210 GSM Pure Ring-Spun Cotton • Circular Ribbed Neckband',
    basePricePaise: 74900
  },
  {
    id: 'V-Neck T-Shirt',
    name: 'V-Neck T-Shirt',
    badge: 'Tailored V-Collar',
    description: '210 GSM Combed Jersey • Clean V-Neck Collarline',
    basePricePaise: 74900
  },
  {
    id: 'Full-Sleeve T-Shirt',
    name: 'Full-Sleeve T-Shirt',
    badge: 'Long Sleeve',
    description: '240 GSM Heavy Cotton • Ribbed Cuffs & Extended Sleeves',
    basePricePaise: 89900
  },
  {
    id: 'Sleeveless T-Shirt',
    name: 'Sleeveless T-Shirt',
    badge: 'Tank / Muscle Cut',
    description: '220 GSM Heavyweight Rib • Clean-Cut Deep Armholes',
    basePricePaise: 69900
  },
  {
    id: 'Crop T-Shirt',
    name: 'Crop T-Shirt',
    badge: 'Modern Crop',
    description: '210 GSM Cotton • Relaxed Cropped Midriff Hem',
    basePricePaise: 69900
  },
  {
    id: 'Hoodie',
    name: 'Hoodie',
    badge: 'Heavy Fleece',
    description: '380 GSM Brushed Fleece • Double-Lined Hood & Kangaroo Pocket',
    basePricePaise: 149900
  },
  {
    id: 'Sweatshirt',
    name: 'Sweatshirt',
    badge: 'Pullover Crew',
    description: '340 GSM French Terry • V-Notch Insert & Ribbed Cuffs',
    basePricePaise: 129900
  }
];

// Rich Palette of Real Garment Colours
const GARMENT_COLORS = [
  { id: 'white', name: 'Optic White', hex: '#FFFFFF', border: '#E5E5E5' },
  { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE', border: '#DCDAD0' },
  { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626', border: '#171717' },
  { id: 'black', name: 'Obsidian Black', hex: '#111111', border: '#000000' },
  { id: 'forest', name: 'Forest Green', hex: '#16382B', border: '#0C2018' },
  { id: 'navy', name: 'Deep Navy', hex: '#1B263B', border: '#101724' },
  { id: 'crimson', name: 'Crimson Burgundy', hex: '#781D22', border: '#4E1114' },
  { id: 'sandstone', name: 'Sandstone Ochre', hex: '#D4C5B9', border: '#B8A89A' }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const SUPPORTED_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Minimal Sans', style: 'font-sans' },
  { id: 'Cormorant Garamond', name: 'Editorial Serif', style: 'font-serif italic' },
  { id: 'Courier New', name: 'Monospace Typewriter', style: 'font-mono' },
  { id: 'Impact', name: 'Bold Grotesque', style: 'font-sans uppercase font-black tracking-wider' },
  { id: 'Georgia', name: 'Classical Antique', style: 'font-serif' },
  { id: 'Trebuchet MS', name: 'Humanist Geometric', style: 'font-sans' }
];

const PRINT_SAFE_PALETTE = [
  { hex: '#111111', name: 'Obsidian Black' },
  { hex: '#FFFFFF', name: 'Pure White' },
  { hex: '#6B7280', name: 'Charcoal Grey' },
  { hex: '#F3F4F6', name: 'Bone' },
  { hex: '#DC2626', name: 'Crimson Red' },
  { hex: '#2563EB', name: 'Cobalt Blue' },
  { hex: '#059669', name: 'Emerald Green' },
  { hex: '#D97706', name: 'Burnt Ochre' },
  { hex: '#9333EA', name: 'Royal Violet' }
];

// Curated Transparent Vector Badges
const CURATED_BADGES = [
  {
    id: 'badge_crest',
    name: 'Blanc Atelier Emblem',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="%23111111" stroke-width="4"/><circle cx="100" cy="100" r="78" fill="none" stroke="%23111111" stroke-width="1.5" stroke-dasharray="4 3"/><text x="100" y="95" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" letter-spacing="4" fill="%23111111">BLANC</text><text x="100" y="115" font-family="serif" font-style="italic" font-size="13" text-anchor="middle" letter-spacing="2" fill="%23111111">Atelier Studio</text><text x="100" y="145" font-family="monospace" font-size="10" text-anchor="middle" letter-spacing="3" fill="%23111111">IND • 2026</text></svg>'
  },
  {
    id: 'badge_barcode',
    name: '240 GSM Barcode',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" viewBox="0 0 240 100"><rect x="10" y="15" width="4" height="50" fill="%23111111"/><rect x="18" y="15" width="2" height="50" fill="%23111111"/><rect x="24" y="15" width="6" height="50" fill="%23111111"/><rect x="34" y="15" width="2" height="50" fill="%23111111"/><rect x="40" y="15" width="8" height="50" fill="%23111111"/><rect x="52" y="15" width="3" height="50" fill="%23111111"/><rect x="60" y="15" width="5" height="50" fill="%23111111"/><rect x="70" y="15" width="2" height="50" fill="%23111111"/><rect x="76" y="15" width="7" height="50" fill="%23111111"/><rect x="88" y="15" width="3" height="50" fill="%23111111"/><rect x="96" y="15" width="6" height="50" fill="%23111111"/><rect x="106" y="15" width="2" height="50" fill="%23111111"/><rect x="112" y="15" width="4" height="50" fill="%23111111"/><rect x="120" y="15" width="8" height="50" fill="%23111111"/><rect x="132" y="15" width="3" height="50" fill="%23111111"/><rect x="140" y="15" width="5" height="50" fill="%23111111"/><rect x="150" y="15" width="2" height="50" fill="%23111111"/><rect x="156" y="15" width="6" height="50" fill="%23111111"/><rect x="166" y="15" width="4" height="50" fill="%23111111"/><rect x="174" y="15" width="8" height="50" fill="%23111111"/><rect x="186" y="15" width="2" height="50" fill="%23111111"/><rect x="192" y="15" width="5" height="50" fill="%23111111"/><rect x="202" y="15" width="3" height="50" fill="%23111111"/><rect x="210" y="15" width="6" height="50" fill="%23111111"/><rect x="220" y="15" width="4" height="50" fill="%23111111"/><text x="120" y="80" font-family="monospace" font-size="11" text-anchor="middle" letter-spacing="4" fill="%23111111">BLC-240-GSM-HEAVY</text></svg>'
  },
  {
    id: 'badge_star',
    name: 'Geometric 8-Point Star',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><polygon points="80,10 95,65 150,80 95,95 80,150 65,95 10,80 65,65" fill="%23111111"/><circle cx="80" cy="80" r="14" fill="%23FFFFFF"/><circle cx="80" cy="80" r="6" fill="%23111111"/></svg>'
  },
  {
    id: 'badge_stamp',
    name: 'Archival Studio Stamp',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="100" viewBox="0 0 220 100"><rect x="10" y="10" width="200" height="80" rx="4" fill="none" stroke="%23111111" stroke-width="3"/><rect x="15" y="15" width="190" height="70" rx="2" fill="none" stroke="%23111111" stroke-width="1" stroke-dasharray="3 2"/><text x="110" y="44" font-family="sans-serif" font-weight="900" font-size="14" text-anchor="middle" letter-spacing="3" fill="%23111111">ARCHIVAL SPECIMEN</text><text x="110" y="65" font-family="monospace" font-size="10" text-anchor="middle" letter-spacing="2" fill="%23111111">AUTHENTIC DROP • 01</text></svg>'
  }
];

// Curated Editorial Typography Templates
const TEMPLATE_CATEGORIES = [
  {
    id: 'minimal',
    name: 'Minimal & Geometry',
    templates: [
      { id: 'tpl_1', name: 'Constructivist Line', text: 'FORM 01\nHEAVYWEIGHT', font: 'Plus Jakarta Sans', color: '#111111', size: 30, isBold: true },
      { id: 'tpl_2', name: 'Archival Coordinates', text: '12°58\'N 77°35\'E\nBLANC ATELIER', font: 'Courier New', color: '#111111', size: 22, isBold: false },
    ]
  },
  {
    id: 'typography',
    name: 'Editorial Typography',
    templates: [
      { id: 'tpl_3', name: 'Silent Movement', text: 'ESSENCE\nSTUDIO DROP', font: 'Cormorant Garamond', color: '#111111', size: 38, isItalic: true },
      { id: 'tpl_4', name: 'Heavy Standard', text: '240 GSM\nPARADIGM', font: 'Impact', color: '#111111', size: 40, isBold: true },
    ]
  },
  {
    id: 'streetwear',
    name: 'Streetwear & Varsity',
    templates: [
      { id: 'tpl_5', name: 'Varsity Society', text: 'ACADEMIA\nCLASS OF \'26', font: 'Impact', color: '#DC2626', size: 34, isBold: true },
      { id: 'tpl_6', name: 'Design Union', text: 'STUDENT UNION\nIND. 2026', font: 'Plus Jakarta Sans', color: '#2563EB', size: 26, isBold: true },
    ]
  }
];

export default function CustomizeStudioPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // 1. Garment Style & Variants State
  const [selectedStyle, setSelectedStyle] = useState(GARMENT_STYLES[0].id);
  const [selectedColor, setSelectedColor] = useState(GARMENT_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'

  // Active product reference
  const [currentProduct, setCurrentProduct] = useState(null);

  // Active Design Identification
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [designName, setDesignName] = useState('Custom T-Shirt Design');

  // Multi-side elements state
  const [sides, setSides] = useState({
    front: { enabled: true, elements: [] },
    back: { enabled: false, elements: [] }
  });

  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Selected element for manipulation
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Studio Sidebar Tabs: 'text' | 'upload' | 'graphics' | 'template' | 'layers'
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

  // Editor Viewport & Boundary Controls
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);

  // Notification helper
  const showStatus = (message, type = 'success') => {
    setStatusNotification({ message, type });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  // Modals & Drawers
  const [showSavedDesignsDrawer, setShowSavedDesignsDrawer] = useState(false);
  const [savedDesignsList, setSavedDesignsList] = useState([]);
  const [savedDesignsLoading, setSavedDesignsLoading] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Canvas Printable Area Ref for Drag Calculation
  const printableAreaRef = useRef(null);

  // Dragging interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    elementId: null,
    startX: 0,
    startY: 0,
    elemStartX: 50,
    elemStartY: 50
  });

  // Load products and match customizable product
  useEffect(() => {
    apiRequest('/products')
      .then((res) => {
        if (res.success && res.products.length > 0) {
          const found = productId
            ? res.products.find(p => p._id === productId || p.slug === productId)
            : res.products.find(p => p.isCustomizable) || res.products[0];
          setCurrentProduct(found);
        }
      })
      .catch((err) => console.error('Product load error:', err));
  }, [productId]);

  // Restore pending design from localStorage if returning from login
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
        showStatus('Restored your custom design from your previous session!', 'success');
      } catch (e) {
        console.warn('Could not restore design:', e);
      }
    }
  }, []);

  // Push history state on side changes
  const saveToHistory = useCallback((newSides) => {
    setHistory((prev) => {
      const updatedHistory = prev.slice(0, historyIndex + 1);
      updatedHistory.push(JSON.parse(JSON.stringify(newSides)));
      return updatedHistory;
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSides(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSides(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleResetCurrentSide = () => {
    const newSides = {
      ...sides,
      [activeSide]: { ...sides[activeSide], elements: [] }
    };
    setSides(newSides);
    saveToHistory(newSides);
    setSelectedElementId(null);
    setShowResetConfirmModal(false);
    showStatus(`Cleared all elements from ${activeSide.toUpperCase()} view.`, 'info');
  };

  // Add text element to active side
  const handleAddTextElement = () => {
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
      isLocked: false,
      zIndex: (sides[activeSide]?.elements?.length || 0) + 1,
      xPercent: 50,
      yPercent: 40,
      scale: 1,
      rotation: 0
    };

    const newSides = {
      ...sides,
      [activeSide]: {
        enabled: true,
        elements: [...sides[activeSide].elements, newElement]
      }
    };

    setSides(newSides);
    saveToHistory(newSides);
    setSelectedElementId(newElement.id);
    showStatus('Text added to design canvas!', 'success');
  };

  // Upload artwork image
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadWarning('');

    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Unsupported format. Please upload PNG (transparent recommended), JPEG, or WebP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB limit.');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('artwork', file);

      const res = await apiRequest('/designs/upload', {
        method: 'POST',
        body: formData
      });

      if (res.success) {
        if (res.warnings?.length > 0) {
          setUploadWarning(res.warnings[0]);
        }

        const newElement = {
          id: `el_img_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: 'image',
          assetId: res.assetId,
          imageUrl: res.url,
          originalFilename: res.originalFilename,
          imageDpi: res.estimatedDpi,
          isLocked: false,
          zIndex: (sides[activeSide]?.elements?.length || 0) + 1,
          xPercent: 50,
          yPercent: 45,
          scale: 1,
          rotation: 0,
          widthPercent: 45,
          heightPercent: 45
        };

        const newSides = {
          ...sides,
          [activeSide]: {
            enabled: true,
            elements: [...sides[activeSide].elements, newElement]
          }
        };

        setSides(newSides);
        saveToHistory(newSides);
        setSelectedElementId(newElement.id);
        showStatus('Artwork uploaded & placed on canvas!', 'success');
      }
    } catch (err) {
      setUploadError(err.message || 'Error uploading artwork');
    } finally {
      setUploadLoading(false);
    }
  };

  // Add curated transparent graphic / badge
  const handleAddBadge = (badge) => {
    const newElement = {
      id: `el_bdg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'image',
      imageUrl: badge.svgUrl,
      originalFilename: badge.name,
      imageDpi: 300,
      isLocked: false,
      zIndex: (sides[activeSide]?.elements?.length || 0) + 1,
      xPercent: 50,
      yPercent: 45,
      scale: 1,
      rotation: 0,
      widthPercent: 45,
      heightPercent: 45
    };

    const newSides = {
      ...sides,
      [activeSide]: {
        enabled: true,
        elements: [...sides[activeSide].elements, newElement]
      }
    };

    setSides(newSides);
    saveToHistory(newSides);
    setSelectedElementId(newElement.id);
    showStatus(`Added "${badge.name}" to canvas!`, 'success');
  };

  // Apply curated template
  const handleApplyTemplate = (tpl) => {
    setInputText(tpl.text);
    setSelectedFont(tpl.font);
    setSelectedTextColor(tpl.color);
    setFontSize(tpl.size);
    setIsBold(!!tpl.isBold);
    setIsItalic(!!tpl.isItalic);

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
      letterSpacing: 0,
      isLocked: false,
      zIndex: (sides[activeSide]?.elements?.length || 0) + 1,
      xPercent: 50,
      yPercent: 45,
      scale: 1,
      rotation: 0
    };

    const newSides = {
      ...sides,
      [activeSide]: {
        enabled: true,
        elements: [...sides[activeSide].elements, newElement]
      }
    };

    setSides(newSides);
    saveToHistory(newSides);
    setSelectedElementId(newElement.id);
    showStatus(`Applied template "${tpl.name}"!`, 'success');
  };

  // Update selected element properties
  const updateSelectedElement = (updates) => {
    if (!selectedElementId) return;

    const currentSideElements = sides[activeSide].elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates };
      }
      return el;
    });

    const newSides = {
      ...sides,
      [activeSide]: { ...sides[activeSide], elements: currentSideElements }
    };
    setSides(newSides);
  };

  // Element Action: Duplicate
  const handleDuplicateElement = (elementId) => {
    const el = sides[activeSide].elements.find(e => e.id === elementId);
    if (!el) return;

    const clone = {
      ...JSON.parse(JSON.stringify(el)),
      id: `el_dup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      xPercent: Math.min(85, el.xPercent + 6),
      yPercent: Math.min(85, el.yPercent + 6),
      zIndex: sides[activeSide].elements.length + 1
    };

    const newSides = {
      ...sides,
      [activeSide]: {
        ...sides[activeSide],
        elements: [...sides[activeSide].elements, clone]
      }
    };
    setSides(newSides);
    saveToHistory(newSides);
    setSelectedElementId(clone.id);
    showStatus('Element duplicated!', 'success');
  };

  // Element Action: Delete
  const handleDeleteElement = (elementId) => {
    const filtered = sides[activeSide].elements.filter(e => e.id !== elementId);
    const newSides = {
      ...sides,
      [activeSide]: { ...sides[activeSide], elements: filtered }
    };
    setSides(newSides);
    saveToHistory(newSides);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
    showStatus('Element removed.', 'info');
  };

  // Element Action: Reorder Layers (bring forward / send backward)
  const handleLayerOrder = (elementId, direction) => {
    const currentElements = [...sides[activeSide].elements];
    const index = currentElements.findIndex(e => e.id === elementId);
    if (index === -1) return;

    if (direction === 'up' && index < currentElements.length - 1) {
      const temp = currentElements[index];
      currentElements[index] = currentElements[index + 1];
      currentElements[index + 1] = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = currentElements[index];
      currentElements[index] = currentElements[index - 1];
      currentElements[index - 1] = temp;
    }

    const newSides = {
      ...sides,
      [activeSide]: { ...sides[activeSide], elements: currentElements }
    };
    setSides(newSides);
    saveToHistory(newSides);
  };

  // DRAG & TOUCH GESTURE HANDLERS
  const handlePointerDown = (e, element) => {
    if (element.isLocked) return;
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setSelectedElementId(element.id);
    setIsDragging(true);

    dragRef.current = {
      elementId: element.id,
      startX: clientX,
      startY: clientY,
      elemStartX: element.xPercent,
      elemStartY: element.yPercent
    };
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !dragRef.current.elementId || !printableAreaRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = printableAreaRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    // Convert pixel delta to percentage of printable container
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    // Constrain position safely within printable boundary (5% to 95%)
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

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current.elementId = null;
      // Record history on drag completion
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

  // Pricing Calculation
  const garmentConfig = GARMENT_STYLES.find(s => s.id === selectedStyle) || GARMENT_STYLES[0];
  const hasFrontPrint = sides.front.enabled && sides.front.elements.length > 0;
  const hasBackPrint = sides.back.enabled && sides.back.elements.length > 0;
  const isDoubleSided = hasFrontPrint && hasBackPrint;
  const baseCost = garmentConfig.basePricePaise;
  const printCost = isDoubleSided ? 45000 : (hasFrontPrint || hasBackPrint ? 25000 : 0);
  const calculatedUnitPrice = baseCost + printCost;

  // CURRENT ACTIVE ELEMENT
  const currentElements = sides[activeSide]?.elements || [];
  const selectedElement = currentElements.find(el => el.id === selectedElementId);

  // SAVE DESIGN HANDLER
  const handleSaveDesign = async (saveAsNew = false) => {
    if (!hasFrontPrint && !hasBackPrint) {
      alert('Please add at least one design element (text or image) to the garment before saving.');
      return;
    }

    // Require sign-in before permanent account saving
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

  // FETCH MY SAVED DESIGNS
  const handleOpenMySavedDesigns = async () => {
    if (!user) {
      const pendingData = { selectedStyle, selectedColor, selectedSize, sides, designName, currentDesignId };
      localStorage.setItem('blanc_studio_pending_design', JSON.stringify(pendingData));
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
      console.error('Error fetching designs:', err);
    } finally {
      setSavedDesignsLoading(false);
    }
  };

  // LOAD A SAVED DESIGN INTO STUDIO CANVAS
  const handleLoadSavedDesign = (design) => {
    setCurrentDesignId(design.designId);
    setDesignName(design.designName || 'Custom T-Shirt Design');
    setSelectedStyle(design.garmentStyle || 'Oversized T-Shirt');
    if (design.selectedColor) {
      const matchedColor = GARMENT_COLORS.find(c => c.hex.toUpperCase() === design.selectedColor.hex?.toUpperCase()) || design.selectedColor;
      setSelectedColor(matchedColor);
    }
    if (design.selectedSize) setSelectedSize(design.selectedSize);
    if (design.sides) setSides(design.sides);
    setSelectedElementId(null);
    setShowSavedDesignsDrawer(false);
    showStatus(`Loaded design "${design.designName}"!`, 'success');
  };

  // DUPLICATE A SAVED DESIGN
  const handleDuplicateSavedDesign = async (designId) => {
    try {
      const res = await apiRequest(`/designs/${designId}/duplicate`, { method: 'POST' });
      if (res.success) {
        showStatus('Design duplicated!', 'success');
        const refreshed = await apiRequest('/designs/my-designs');
        if (refreshed.success) setSavedDesignsList(refreshed.designs || []);
      }
    } catch (err) {
      alert(err.message || 'Could not duplicate design');
    }
  };

  // DELETE A SAVED DESIGN
  const handleDeleteSavedDesign = async (designId) => {
    try {
      const res = await apiRequest(`/designs/${designId}`, { method: 'DELETE' });
      if (res.success) {
        showStatus('Design deleted.', 'info');
        setSavedDesignsList(prev => prev.filter(d => d.designId !== designId));
        setDeleteConfirmId(null);
        if (currentDesignId === designId) {
          setCurrentDesignId(null);
        }
      }
    } catch (err) {
      alert(err.message || 'Could not delete design');
    }
  };

  // ADD TO CART HANDLER
  const handleAddToCart = async () => {
    if (!hasFrontPrint && !hasBackPrint) {
      alert('Please add at least one design element (text or image) to the garment before adding to cart.');
      return;
    }

    try {
      setSaveLoading(true);

      // Auto-save design first to obtain server-verified designId
      const saveRes = await apiRequest('/designs/save', {
        method: 'POST',
        body: JSON.stringify({
          designId: currentDesignId,
          designName: designName.trim(),
          garmentStyle: selectedStyle,
          productId: currentProduct?._id,
          selectedColor: { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex },
          selectedSize: selectedSize,
          sides: sides
        })
      });

      if (saveRes.success) {
        setCurrentDesignId(saveRes.designId);

        const printLocations = [];
        if (hasFrontPrint) printLocations.push('front');
        if (hasBackPrint) printLocations.push('back');

        await addToCart({
          productId: currentProduct?._id,
          isCustom: true,
          customDesignId: saveRes.designId,
          garmentStyle: selectedStyle,
          designVersion: saveRes.version,
          selectedSize: selectedSize,
          selectedColor: { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex },
          printLocations: printLocations,
          previewImageUrl: saveRes.previewThumbnail || currentProduct?.images?.[0]?.url,
          quantity: quantity
        });

        showStatus('Customized garment added to shopping bag!', 'success');
      }
    } catch (err) {
      alert(err.message || 'Failed to save & add customized tee to cart.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Toast Notification Banner */}
      {statusNotification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-xl flex items-center gap-2.5 text-xs font-medium text-white transition-all transform animate-bounce ${
          statusNotification.type === 'success' ? 'bg-black' : statusNotification.type === 'info' ? 'bg-neutral-800' : 'bg-red-700'
        }`}>
          {statusNotification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-blue-400" />}
          <span>{statusNotification.message}</span>
        </div>
      )}

      {/* TOP BAR: Title, Actions & Live Pricing */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#E5E5E0] gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Print-on-Demand Studio
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900">
              Custom T-Shirt Atelier
            </h1>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Design Title (e.g. Summer Capsule)"
              className="text-xs px-2.5 py-1 border border-neutral-300 rounded font-medium focus:border-black focus:outline-none"
              title="Click to rename this design"
            />
          </div>
        </div>

        {/* Top Actions: Save Design, Save as New, My Saved Designs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleSaveDesign(false)}
            disabled={saveLoading}
            className="px-3.5 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveLoading ? 'Saving...' : 'Save Design'}</span>
          </button>

          <button
            onClick={() => handleSaveDesign(true)}
            disabled={saveLoading}
            className="px-3.5 py-2.5 border border-neutral-300 text-neutral-800 hover:border-black text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save as New</span>
          </button>

          <button
            onClick={handleOpenMySavedDesigns}
            className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors"
          >
            <FolderHeart className="w-3.5 h-3.5 text-neutral-700" />
            <span>My Saved Designs</span>
          </button>

          {/* Configured Unit Price pill */}
          <div className="flex items-center gap-3 bg-white border border-neutral-300 px-3 py-1.5 rounded text-xs ml-auto lg:ml-0">
            <div>
              <span className="text-neutral-500 block uppercase tracking-wider text-[9px]">Unit Price</span>
              <span className="font-mono text-sm font-bold text-neutral-900">
                {formatPrice(calculatedUnitPrice)}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-neutral-200" />
            <div className="text-[10px] text-neutral-500 font-mono">
              <span>{isDoubleSided ? 'Front + Back' : hasFrontPrint || hasBackPrint ? '1-Side Print' : 'Garment Only'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN STUDIO GRID (Left: Toolbars & Tools, Center: Canvas, Right: Garment Variants & Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 mt-8 items-start">
        {/* ========================================================
         * LEFT SIDEBAR: Tools, Text, Upload, Badges, Templates, Layers (4 cols)
         * ======================================================== */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E0] rounded-sm p-5 space-y-5 shadow-sm order-2 lg:order-1">
          {/* Tool Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-neutral-100 p-1 rounded text-[11px] font-semibold text-neutral-600">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'text' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
              }`}
              title="Add Typography"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'upload' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
              }`}
              title="Upload PNG / Graphic"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => setActiveTab('graphics')}
              className={`py-2 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'graphics' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
              }`}
              title="Aesthetic Vector Badges"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Badges</span>
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`py-2 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'template' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
              }`}
              title="Typography Presets"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`py-2 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'layers' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
              }`}
              title="Layer Management"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
            </button>
          </div>

          {/* TAB 1: ADD TEXT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-600 block mb-1 font-medium">Text Content</label>
                <textarea
                  rows="2"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter custom slogan or phrase..."
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Font Family</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full text-xs p-2 border border-neutral-300 rounded bg-white focus:outline-none"
                  >
                    {SUPPORTED_FONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Size: {fontSize}px</label>
                  <input
                    type="range"
                    min="16"
                    max="68"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-600 mb-1 font-medium">
                  <span>Letter Spacing</span>
                  <span className="font-mono text-[11px]">{letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="12"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Text Styling Bar: Bold, Italic, Alignment */}
              <div className="flex items-center justify-between border border-neutral-200 p-2 rounded text-xs bg-neutral-50">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsBold(!isBold)}
                    className={`p-1.5 rounded transition-colors ${isBold ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsItalic(!isItalic)}
                    className={`p-1.5 rounded transition-colors ${isItalic ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`p-1.5 rounded transition-colors ${textAlign === 'left' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTextAlign('center')}
                    className={`p-1.5 rounded transition-colors ${textAlign === 'center' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTextAlign('right')}
                    className={`p-1.5 rounded transition-colors ${textAlign === 'right' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Print Safe Color Palette */}
              <div>
                <label className="text-xs text-neutral-600 block mb-1.5 font-medium">Text Color (DTG Inks)</label>
                <div className="flex flex-wrap gap-2">
                  {PRINT_SAFE_PALETTE.map((pal) => (
                    <button
                      key={pal.hex}
                      onClick={() => setSelectedTextColor(pal.hex)}
                      title={pal.name}
                      className={`w-6 h-6 rounded-full border border-neutral-300 transition-transform ${
                        selectedTextColor === pal.hex ? 'scale-125 ring-2 ring-black' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: pal.hex }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddTextElement}
                className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Text to {activeSide.toUpperCase()} View</span>
              </button>
            </div>
          )}

          {/* TAB 2: UPLOAD ARTWORK */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-black p-6 rounded-sm text-center cursor-pointer transition-colors bg-neutral-50/50"
              >
                <Upload className="w-6 h-6 mx-auto text-neutral-500 mb-2" />
                <p className="text-xs font-semibold text-neutral-900">Click to upload artwork graphic</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  PNG transparent recommended, JPEG, WebP up to 15MB.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </div>

              {uploadLoading && (
                <p className="text-xs text-neutral-600 font-mono animate-pulse">
                  Validating resolution and processing file...
                </p>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURATED BADGES */}
          {activeTab === 'graphics' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Select high-resolution vector streetwear graphics and atelier stamps:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {CURATED_BADGES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleAddBadge(b)}
                    className="p-3 border border-neutral-200 rounded text-center hover:border-black bg-neutral-50/60 hover:bg-white transition-all flex flex-col items-center justify-between gap-2"
                  >
                    <div className="h-16 w-full flex items-center justify-center overflow-hidden">
                      <img src={b.svgUrl} alt={b.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-800 uppercase tracking-wider line-clamp-1">
                      {b.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CURATED TEMPLATES */}
          {activeTab === 'template' && (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-neutral-500 font-bold tracking-wider">
                    {cat.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleApplyTemplate(tpl)}
                        className="p-3 border border-neutral-200 rounded text-left hover:border-black bg-neutral-50/50 hover:bg-white transition-all group"
                      >
                        <p className="text-xs font-semibold text-neutral-900 leading-tight">
                          {tpl.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1 whitespace-pre-line line-clamp-2">
                          {tpl.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: LAYERS MANAGEMENT */}
          {activeTab === 'layers' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-700">Layers on {activeSide.toUpperCase()} ({currentElements.length})</span>
                {currentElements.length > 0 && (
                  <button
                    onClick={() => setShowResetConfirmModal(true)}
                    className="text-red-600 hover:underline text-[11px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {currentElements.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No elements on {activeSide} view yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {currentElements.map((el, idx) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`p-2.5 border rounded flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedElementId === el.id
                          ? 'border-black bg-neutral-50 ring-1 ring-black shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-neutral-400">#{idx + 1}</span>
                        {el.type === 'text' ? (
                          <Type className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium text-neutral-800">
                          {el.type === 'text' ? el.text.replace(/\n/g, ' ') : el.originalFilename || 'Artwork Image'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSelectedElement({ isLocked: !el.isLocked });
                          }}
                          className="p-1 text-neutral-500 hover:text-black"
                          title={el.isLocked ? 'Unlock' : 'Lock'}
                        >
                          {el.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLayerOrder(el.id, 'up');
                          }}
                          className="p-1 text-neutral-500 hover:text-black"
                          title="Bring Forward"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLayerOrder(el.id, 'down');
                          }}
                          className="p-1 text-neutral-500 hover:text-black"
                          title="Send Backward"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
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

        {/* ========================================================
         * CENTER: Interactive Canvas, Garment Mockup & Controls (5 cols)
         * ======================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
          {/* Top Canvas Controls Bar: View Toggle, Zoom, Undo, Redo */}
          <div className="w-full flex items-center justify-between bg-white border border-neutral-200 p-2 rounded-t text-xs mb-[-1px] z-10 shadow-sm">
            {/* Front / Back View Switcher */}
            <div className="flex bg-neutral-100 p-1 rounded">
              <button
                onClick={() => {
                  setActiveSide('front');
                  setSelectedElementId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                  activeSide === 'front' ? 'bg-black text-white shadow' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Front {sides.front.elements.length > 0 && `(${sides.front.elements.length})`}
              </button>
              <button
                onClick={() => {
                  setActiveSide('back');
                  setSelectedElementId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                  activeSide === 'back' ? 'bg-black text-white shadow' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Back {sides.back.elements.length > 0 && `(${sides.back.elements.length})`}
              </button>
            </div>

            {/* Actions: Undo, Redo, Zoom, Guides, Reset */}
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-neutral-600 hover:text-black disabled:opacity-30 rounded hover:bg-neutral-100"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-neutral-600 hover:text-black disabled:opacity-30 rounded hover:bg-neutral-100"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="h-4 w-[1px] bg-neutral-200" />
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                className="p-1.5 text-neutral-600 hover:text-black rounded hover:bg-neutral-100"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))}
                className="p-1.5 text-neutral-600 hover:text-black rounded hover:bg-neutral-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowPrintGuides(!showPrintGuides)}
                className={`p-1.5 rounded transition-colors ${
                  showPrintGuides ? 'text-blue-600 bg-blue-50' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                title="Toggle 12x16 Print Boundary"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="p-1.5 text-neutral-600 hover:text-red-600 rounded hover:bg-neutral-100"
                title="Reset View"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Mockup Container */}
          <div
            className="relative w-full aspect-[4/5] bg-[#F7F7F4] border border-neutral-300 rounded-b shadow-inner flex items-center justify-center overflow-hidden select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Scaled Garment Silhouette & Elements Container */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Vector SVG Garment Mockup (Renders all 10 real styles accurately) */}
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
                      ? 'border-2 border-dashed border-blue-500/80 bg-blue-500/5'
                      : 'border border-transparent'
                  }`}
                >
                  {showPrintGuides && (
                    <div className="absolute -top-5 left-0 right-0 flex justify-between text-[8px] font-mono text-blue-600 font-semibold px-1">
                      <span>12" x 16" PRINTABLE AREA</span>
                      <span>300 DPI</span>
                    </div>
                  )}

                  {/* Render Design Elements */}
                  {currentElements.map((el) => {
                    const isSelected = el.id === selectedElementId;

                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handlePointerDown(e, el)}
                        onTouchStart={(e) => handlePointerDown(e, el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
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

                        {/* VISIBLE ACTIVE BOUNDING CONTROLS FOR SELECTED ELEMENT */}
                        {isSelected && !el.isLocked && (
                          <div className="absolute -top-7 -right-2 flex items-center gap-1 bg-black text-white p-1 rounded shadow-md text-[10px] z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateElement(el.id);
                              }}
                              className="hover:text-blue-400 p-0.5"
                              title="Duplicate"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id);
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
                  {currentElements.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400 pointer-events-none">
                      <p className="font-editorial text-lg italic text-neutral-400">Empty Printable Area</p>
                      <p className="text-[11px] font-sans text-neutral-400 mt-1">
                        Use sidebar to add custom text, upload logos, or apply presets.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONTEXTUAL TOOLBAR (When an element is selected) */}
          {selectedElement && (
            <div className="w-full mt-3 bg-white border border-neutral-300 p-3 rounded text-xs space-y-2.5 shadow-sm">
              <div className="flex justify-between items-center pb-1.5 border-b border-neutral-100">
                <span className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Active Element Controls</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSelectedElement({ isLocked: !selectedElement.isLocked })}
                    className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1"
                  >
                    {selectedElement.isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3" />}
                    <span>{selectedElement.isLocked ? 'Unlock' : 'Lock Position'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Sliders: Scale, Rotate, Horizontal, Vertical */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                    <span>Scale</span>
                    <span className="font-mono">{Math.round((selectedElement.scale || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={selectedElement.scale || 1}
                    onChange={(e) => updateSelectedElement({ scale: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                    <span>Rotate</span>
                    <span className="font-mono">{selectedElement.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedElement.rotation || 0}
                    onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                    <span>Y Position</span>
                    <span className="font-mono">{selectedElement.yPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={selectedElement.yPercent || 50}
                    onChange={(e) => updateSelectedElement({ yPercent: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
         * RIGHT SIDEBAR: Garment Dropdown, Color Swatches, Size, Order (3 cols)
         * ======================================================== */}
        <div className="lg:col-span-3 bg-white border border-[#E5E5E0] rounded-sm p-5 space-y-5 shadow-sm order-3">
          {/* STEP 1: Garment Style Selection Dropdown */}
          <div className="space-y-3 pb-5 border-b border-[#E5E5E0]">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-neutral-900 block mb-1">
                Choose Your T-Shirt Style
              </label>
              <p className="text-[11px] text-neutral-500">
                Select from our authentic handcrafted garment silhouettes:
              </p>
            </div>

            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded bg-white text-xs font-semibold focus:border-black focus:outline-none"
            >
              {GARMENT_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name} — {formatPrice(style.basePricePaise)}
                </option>
              ))}
            </select>

            {/* Garment Silhouette Description Badge */}
            <div className="bg-neutral-50 p-2.5 rounded border border-neutral-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">{garmentConfig.name}</span>
                <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] uppercase tracking-wider font-bold">
                  {garmentConfig.badge}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">
                {garmentConfig.description}
              </p>
            </div>
          </div>

          {/* STEP 2: Color Swatches */}
          <div className="space-y-3 pb-5 border-b border-[#E5E5E0]">
            <div className="flex justify-between items-center text-xs">
              <label className="text-neutral-700 font-medium">Garment Colour</label>
              <span className="font-semibold text-neutral-900">{selectedColor.name}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {GARMENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c)}
                  title={c.name}
                  className={`h-9 rounded border flex items-center justify-center transition-all ${
                    selectedColor.id === c.id
                      ? 'border-black ring-2 ring-black scale-105 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor.id === c.id && (
                    <Check className={`w-3.5 h-3.5 ${['#FFFFFF', '#F5F4EE', '#D4C5B9'].includes(c.hex) ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Size Selection */}
          <div className="space-y-3 pb-5 border-b border-[#E5E5E0]">
            <div className="flex justify-between items-center text-xs">
              <label className="text-neutral-700 font-medium">Select Size</label>
              <span className="font-mono font-bold text-neutral-900">{selectedSize}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-semibold">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2 border rounded transition-colors ${
                    selectedSize === sz
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'border-neutral-300 text-neutral-700 hover:border-black'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: Quantity & Pricing Summary */}
          <div className="space-y-3 pb-5 border-b border-[#E5E5E0] text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 font-medium">Quantity</span>
              <div className="flex items-center border border-neutral-300 rounded font-mono">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-3 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-2 font-mono text-[11px] text-neutral-500">
              <div className="flex justify-between">
                <span>Garment Base:</span>
                <span>{formatPrice(baseCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Print ({isDoubleSided ? 'Front + Back' : '1 Side'}):</span>
                <span>{formatPrice(printCost)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                <span>Subtotal ({quantity}x):</span>
                <span>{formatPrice(calculatedUnitPrice * quantity)}</span>
              </div>
            </div>
          </div>

          {/* STEP 5: Add Customized Tee to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={saveLoading || (!hasFrontPrint && !hasBackPrint)}
            className="w-full py-3.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-all uppercase text-xs tracking-widest font-bold flex items-center justify-center gap-2 rounded shadow"
          >
            {saveLoading ? (
              <span>Saving & Verifying...</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
       * DRAWER: MY SAVED DESIGNS
       * ======================================================== */}
      {showSavedDesignsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSavedDesignsDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#FAFAF8] shadow-2xl flex flex-col border-l border-[#E5E5E0]">
              <div className="p-5 border-b border-[#E5E5E0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderHeart className="w-5 h-5 text-neutral-800" />
                  <h2 className="text-xl font-editorial font-semibold">My Saved Designs</h2>
                </div>
                <button
                  onClick={() => setShowSavedDesignsDrawer(false)}
                  className="p-1.5 text-neutral-400 hover:text-black rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {savedDesignsLoading ? (
                  <div className="py-12 text-center text-xs text-neutral-500 font-mono animate-pulse">
                    Loading your saved ateliers...
                  </div>
                ) : savedDesignsList.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <p className="font-editorial text-xl italic text-neutral-400">No saved designs yet.</p>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      Create a personalized t-shirt and click "Save Design" to store it in your account archive.
                    </p>
                  </div>
                ) : (
                  savedDesignsList.map((design) => (
                    <div
                      key={design.designId}
                      className="bg-white border border-neutral-200 rounded p-4 space-y-3 shadow-sm hover:border-neutral-400 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                            {design.garmentStyle || 'Oversized T-Shirt'}
                          </span>
                          <h3 className="font-editorial text-lg font-semibold text-neutral-900 mt-0.5">
                            {design.designName}
                          </h3>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border border-neutral-300"
                          style={{ backgroundColor: design.selectedColor?.hex || '#FFFFFF' }}
                          title={design.selectedColor?.name || 'White'}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span>Size: <strong className="text-neutral-800">{design.selectedSize}</strong></span>
                        <span>Modified: {new Date(design.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Design Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                        <button
                          onClick={() => handleLoadSavedDesign(design)}
                          className="flex-1 py-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider rounded"
                        >
                          Load in Studio
                        </button>
                        <button
                          onClick={() => handleDuplicateSavedDesign(design.designId)}
                          className="p-1.5 border border-neutral-300 hover:border-black rounded text-neutral-700"
                          title="Duplicate Design"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(design.designId)}
                          className="p-1.5 border border-neutral-200 hover:border-red-600 text-neutral-400 hover:text-red-600 rounded"
                          title="Delete Design"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Delete Confirmation Alert inline */}
                      {deleteConfirmId === design.designId && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 space-y-2">
                          <p className="font-medium">Permanently delete this design from your account?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteSavedDesign(design.designId)}
                              className="px-3 py-1 bg-red-700 text-white rounded font-semibold text-[11px]"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 bg-white border border-neutral-300 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
       * MODAL: RESET VIEW CONFIRMATION
       * ======================================================== */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full p-6 rounded shadow-2xl space-y-4 border border-neutral-200">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial text-xl font-semibold text-neutral-900">Reset {activeSide.toUpperCase()} Canvas?</h3>
              <p className="text-xs text-neutral-600 mt-1">
                This will remove all text, badges, and uploaded images currently placed on the {activeSide} view of the garment.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleResetCurrentSide}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-red-700"
              >
                Clear Elements
              </button>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold uppercase tracking-wider rounded hover:border-black"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
