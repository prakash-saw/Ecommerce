import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Sparkles, Check, Truck, ShieldCheck,
  RefreshCw, Ruler, AlertCircle, Heart, MessageSquare
} from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SizeRecommenderModal from '../components/SizeRecommenderModal';
import ReviewsSection from '../components/ReviewsSection';
import { createWhatsAppUrl } from '../utils/whatsapp';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [selectedColor, setSelectedColor] = useState({ id: 'white', name: 'Optic White', hex: '#FFFFFF' });
  const [quantity, setQuantity] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState('');

  useEffect(() => {
    apiRequest(`/products/slug/${slug}`)
      .then((res) => {
        if (res.success) {
          setProduct(res.product);
          if (res.product.variants?.[0]?.color) {
            setSelectedColor(res.product.variants[0].color);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="font-editorial text-2xl animate-pulse">Loading Garment Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-editorial text-3xl">Garment Not Found</h2>
        <Link to="/shop" className="text-xs uppercase tracking-widest underline">Return to Shop</Link>
      </div>
    );
  }

  // Active variant stock
  const currentVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color?.id === selectedColor?.id
  ) || product.variants?.[0];

  const stockAvailable = currentVariant?.stockQuantity ?? 25;

  const handleAddReadyToWear = async () => {
    try {
      setAddLoading(true);
      await addToCart({
        productId: product._id,
        variantId: currentVariant?._id,
        isCustom: false,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        previewImageUrl: product.images?.[0]?.url,
        quantity: quantity
      });
    } catch (err) {
      alert(err.message || 'Error adding to bag');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    const isNowIn = await toggleWishlist(product);
    setWishlistFeedback(isNowIn ? 'Saved to your wishlist' : 'Removed from wishlist');
    setTimeout(() => setWishlistFeedback(''), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left: Product Images Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="aspect-[4/5] bg-neutral-100 dark:bg-noir-card border border-neutral-200 dark:border-noir-border overflow-hidden rounded-sm relative">
            <img
              src={product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-noir-card/95 backdrop-blur-sm px-3 py-1 text-xs font-mono tracking-wider uppercase border border-neutral-200 dark:border-noir-border text-neutral-900 dark:text-white">
              {product.fabric?.gsm || 240} GSM
            </div>
          </div>

          {/* Thumbnails row */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-24 flex-shrink-0 border rounded-sm overflow-hidden transition-all ${
                    selectedImage === idx ? 'border-black dark:border-white ring-1 ring-black dark:ring-white' : 'border-neutral-300 dark:border-noir-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Garment Purchasing Controls & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2 border-b border-[#E5E5E0] dark:border-noir-border pb-6">
            <span className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
              Drop 01 // {product.category === 'custom_blank' ? 'Studio Blank' : 'Ready-to-Wear'}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-xl font-bold text-neutral-900 dark:text-white">
                {formatPrice(product.basePricePaise)}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${
                stockAvailable > 0
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {stockAvailable > 0 ? `${stockAvailable} In Stock` : 'Sold Out'}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            {product.description}
          </p>

          {/* Size Selector with "Find My Size" trigger */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-neutral-900 dark:text-white">Garment Size</span>
              <button
                type="button"
                onClick={() => setShowSizeModal(true)}
                className="text-neutral-900 dark:text-white text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 hover:underline"
              >
                <Ruler className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <span>Find My Size (Specs)</span>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-3 text-xs font-mono font-medium border rounded transition-colors ${
                    selectedSize === sz
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold'
                      : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 hover:border-black'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Direct WhatsApp Sizing Help Link */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Not sure about chest ease?</span>
              <a
                href={createWhatsAppUrl('sizing', { productName: product.name, chest: '96 cm', fitPreference: 'oversized' })}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono uppercase text-[10px]"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat Sizing on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-900 dark:text-white block">Available Colour</span>
            <div className="flex gap-2">
              {[
                { id: 'white', name: 'Optic White', hex: '#FFFFFF' },
                { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE' },
                { id: 'charcoal', name: 'Washed Charcoal', hex: '#262626' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c)}
                  className={`px-3 py-1.5 border rounded text-xs flex items-center gap-2 ${
                    selectedColor.id === c.id
                      ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-neutral-50 dark:bg-noir-card'
                      : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add to Bag CTA & Wishlist Button */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <button
                onClick={handleAddReadyToWear}
                disabled={addLoading || stockAvailable === 0}
                className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-all uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{addLoading ? 'Adding...' : 'Add to Bag'}</span>
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`px-5 py-4 border rounded transition-all flex items-center justify-center ${
                  isInWishlist(product._id)
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600'
                    : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white'
                }`}
                title={isInWishlist(product._id) ? "In Wishlist" : "Save to Wishlist"}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {wishlistFeedback && (
              <p className="text-[11px] font-mono text-center text-neutral-600 dark:text-neutral-300 animate-in fade-in">
                ✦ {wishlistFeedback}
              </p>
            )}

            {/* Customizer POD CTA if product is customizable */}
            {product.isCustomizable && (
              <Link
                to={`/customize/${product._id}`}
                className="w-full py-3.5 bg-white dark:bg-noir-card text-black dark:text-white border border-neutral-400 dark:border-noir-border hover:border-black dark:hover:border-white transition-colors uppercase text-xs tracking-widest font-semibold flex items-center justify-center gap-2 rounded shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customize This Shirt in POD Studio</span>
              </Link>
            )}
          </div>

          {/* Garment Details Accordion */}
          <div className="border-t border-[#E5E5E0] dark:border-noir-border pt-6 space-y-4 text-xs">
            <div className="space-y-1">
              <strong className="text-neutral-900 dark:text-white block uppercase tracking-wider text-[11px]">Fabric Specification</strong>
              <p className="text-neutral-600 dark:text-neutral-400">
                {product.fabric?.gsm} GSM {product.fabric?.material}. {product.fabric?.finish}.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-neutral-900 dark:text-white block uppercase tracking-wider text-[11px]">Fit & Silhouette</strong>
              <p className="text-neutral-600 dark:text-neutral-400">
                {product.fabric?.fit}. Oversized sleeve drop with snug ribbed neckband.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-neutral-900 dark:text-white block uppercase tracking-wider text-[11px]">Garment Care</strong>
              <ul className="text-neutral-600 dark:text-neutral-400 list-disc list-inside space-y-0.5">
                {product.fabric?.care?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sizing Recommender Modal */}
      <SizeRecommenderModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        product={product}
        currentSelectedSize={selectedSize}
        onSelectSize={(newSize) => setSelectedSize(newSize)}
        variants={product.variants || []}
      />

      {/* Ratings & Verified Reviews Section */}
      <ReviewsSection productId={product._id} productName={product.name} />
    </div>
  );
}
