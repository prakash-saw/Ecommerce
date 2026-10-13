# BLANC ATELIER — Premium Minimalist T-Shirt Ecommerce & Print-on-Demand Studio

A production-grade full-stack ecommerce and custom Print-on-Demand (POD) web application built for college creators and Gen Z in India selling 240+ GSM heavyweight white printed t-shirts.

---

## ✦ Key Features

### 1. Ready-to-Wear Minimalist Collection
- **Curated Catalogue**: High-density 240–260 GSM combed cotton drop-shoulder tees with genuine fabric, fit, and care specifications.
- **Real Inventory Tracking**: Variants mapped across sizes (`S`, `M`, `L`, `XL`, `XXL`) and authentic garment colorways (Optic White, Vintage Off-White, Washed Charcoal).
- **Unified Shopping Bag**: Slide-over drawer with instant line item adjustments, coupon calculation (`WELCOME10`, `GENZ20`), and free delivery threshold indicator (₹1,499).

### 2. Interactive Print-on-Demand (POD) Studio (`/customize` and `/customize/:productId`)
- **Step 1: Choose Garment**: Pick base garment style, color, size, and quantity.
- **Step 2: Choose Customization Method**:
  - **Upload Artwork**: PNG (transparent alpha channel support), JPEG, WebP with automated dimension and DPI validation (150–300 DPI warnings).
  - **Add Typography**: Editorial Serif (Cormorant Garamond), Minimal Sans (Plus Jakarta Sans), Street Monospace, and Bold Grotesque with print-safe palette selections.
  - **Curated Templates**: Original Minimal, Typography, and College Varsity designs.
- **Step 3: Live Dual-Side Canvas Mockup**:
  - Switch between Front and Back garment views.
  - Constrained 12" x 16" printable boundary box with toggleable guides.
  - Drag, scale, and rotate controls with live Undo/Redo/Reset.
- **Step 4: Quality & Pre-Press Validation**:
  - Boundary clipping detection and on-screen vs. physical DTG pigment ink disclaimer.
- **Step 5: Stable Server Storage**:
  - Designs saved with immutable versioning, thumbnail snapshots stored directly to disk (never massive base64 blobs in database).

### 3. Server-Authoritative Integer Paise Pricing Engine
- Operates strictly in integer paise (1 INR = 100 paise) on the backend.
- Base garment + Single side print (₹250 = 25,000 paise) or Double side print (₹450 = 45,000 paise) + 5% Indian apparel GST + shipping calculation.
- Client submitted prices are never trusted.

### 4. Razorpay Payment Gateway & Checkout
- Indian shipping address validation (10-digit mobile number, 6-digit PIN code, state selection).
- Server-generated Razorpay payment orders.
- HMAC-SHA256 signature verification and idempotent webhook handling via raw request buffer.
- Automatic sandbox / test emulation mode for local development without live credentials.

### 5. Print-on-Demand Fulfilment Engine & Production Queue
- **Manual Fulfilment Mode (Active by default)**:
  - Verified paid custom orders automatically spawn pre-press `PODJob` production tickets.
  - Admin reviews high-resolution files, checks DPI, and approves or rejects with custom feedback.
  - Status lifecycle: `pending_review` ➔ `approved` ➔ `printing` ➔ `quality_passed` ➔ `completed` with courier tracking.
  - Generates downloadable 300 DPI Pre-Press Production Manifests.
- **Automated Provider Adapter Interface**:
  - Extensible adapter architecture ready to connect external POD APIs (e.g. Printrove, Qikink, Gelato).

### 6. Curated Wishlist & Saved Pieces (`/wishlist`)
- **Quick-Save Heart Icons**: Easily save or remove items with optimistic micro-interactions across the Homepage, Shop collection, and Product detail pages.
- **Dedicated Wishlist View**: Manage saved garments, select sizes, and click "Move to Bag" or "Customise in Studio".
- **Real-Time Badge Counter**: Floating heart icon in header tracks saved items live.
- **Guest & User Persistence**: Saves seamlessly for both guest visitors and authenticated user accounts.

### 7. Dual Aesthetic Visual Themes (Blanc Minimal vs. Obsidian Noir)
- **Theme Switcher**: Instant toggle in header and account settings between **Blanc Pure (Light)** and **Obsidian Noir (Dark)**.
- **Editorial Dark Mode**: High-contrast charcoal surfaces with luminous typography engineered for evening design studio sessions.
- **Persistence**: Persisted to `localStorage` and automatically synchronized to the user's account profile.

### 8. User Settings & Account Management (`/account` & `/settings`)
- **Personal Details**: Update full name, registered mobile phone number with real-time feedback.
- **Saved Delivery Addresses**: Add, view, and remove multiple Indian delivery addresses (street address, city, state, 6-digit PIN code).
- **Account Security**: Change password with current password verification.
- **Order History**: Access historical orders with direct tracking links.

### 9. Protected Admin Console (`/admin`)
- Production queue monitoring and artwork inspection.
- Customer order dispatching and BlueDart / Delhivery tracking assignment.
- Catalogue inventory manager and fulfillment mode toggling.

---

## ✦ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Pure JavaScript/JSX (No TypeScript).
- **Backend**: Node.js, Express, Mongoose, Multer, JWT, Bcrypt, Razorpay SDK.
- **Database**: MongoDB Atlas support + Automatic zero-config In-Memory MongoDB fallback for instantaneous local evaluation.

---

## ✦ Quick Start

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```

### 2. Start Both Server and Client
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173/`
- **Backend API**: `http://localhost:5000/api`
- **Default Admin Account**: `admin@blancatelier.com` / `admin123`

---

## ✦ Automated Verification Tests

Run the built-in test suites:
```bash
# Unit & Service tests (Pricing, DPI, Manifest, Provider Adapter)
npm test

# Full End-to-End Customer & Admin Flow Test
node server/test/e2eCustomerJourney.js
```

---

## ✦ Environment Configuration (`server/.env`)

```env
PORT=5000
MONGODB_URI=                  # MongoDB Atlas URI (leave empty for zero-config in-memory testing)
JWT_SECRET=your_jwt_secret    # JSON Web Token secret key
RAZORPAY_KEY_ID=              # Razorpay Key ID (leave empty for sandbox test mode)
RAZORPAY_KEY_SECRET=          # Razorpay Key Secret
RAZORPAY_WEBHOOK_SECRET=       # Razorpay Webhook Secret
POD_FULFILLMENT_MODE=manual   # 'manual' (default) or 'automated'
POD_PROVIDER_API_KEY=         # External POD provider key (optional)
```
