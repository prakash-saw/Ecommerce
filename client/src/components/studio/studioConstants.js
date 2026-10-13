// 10 Real Garment Categories with Specifications
export const GARMENT_STYLES = [
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
export const GARMENT_COLORS = [
  { id: 'white', name: 'Optic White', hex: '#FFFFFF', border: '#E5E5E5' },
  { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE', border: '#DCDAD0' },
  { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626', border: '#171717' },
  { id: 'black', name: 'Obsidian Black', hex: '#111111', border: '#000000' },
  { id: 'forest', name: 'Forest Green', hex: '#16382B', border: '#0C2018' },
  { id: 'navy', name: 'Deep Navy', hex: '#1B263B', border: '#101724' },
  { id: 'crimson', name: 'Crimson Burgundy', hex: '#781D22', border: '#4E1114' },
  { id: 'sandstone', name: 'Sandstone Ochre', hex: '#D4C5B9', border: '#B8A89A' }
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SUPPORTED_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Minimal Sans', style: 'font-sans' },
  { id: 'Cormorant Garamond', name: 'Editorial Serif', style: 'font-serif italic' },
  { id: 'Courier New', name: 'Monospace Typewriter', style: 'font-mono' },
  { id: 'Impact', name: 'Bold Grotesque', style: 'font-sans uppercase font-black tracking-wider' },
  { id: 'Georgia', name: 'Classical Antique', style: 'font-serif' },
  { id: 'Trebuchet MS', name: 'Humanist Geometric', style: 'font-sans' }
];

export const PRINT_SAFE_PALETTE = [
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
export const CURATED_BADGES = [
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
export const TEMPLATE_CATEGORIES = [
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
