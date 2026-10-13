import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Sparkles, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../api/client';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addingId, setAddingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleSizeChange = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleMoveToBag = async (product) => {
    try {
      setAddingId(product._id);
      const chosenSize = selectedSizes[product._id] || 'L';
      const defaultColor = product.variants?.[0]?.color || { id: 'white', name: 'Optic White', hex: '#FFFFFF' };

      // Find matching variant
      const variant = product.variants?.find(v => v.size === chosenSize) || product.variants?.[0];

      if (variant && variant.stockQuantity <= 0) {
        alert(`Size ${chosenSize} is currently out of stock.`);
        return;
      }

      await addToCart({
        productId: product._id,
        variantId: variant?._id,
        isCustom: false,
        selectedSize: chosenSize,
        selectedColor: defaultColor,
        previewImageUrl: product.images?.[0]?.url,
        quantity: 1
      });

      // Remove from wishlist after moving to bag
      await removeFromWishlist(product._id);
      setFeedback(`Moved "${product.name}" (Size ${chosenSize}) to your bag.`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      alert(err.message || 'Error adding to bag');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (productId, name) => {
    await removeFromWishlist(productId);
    setFeedback(`Removed "${name}" from your wishlist.`);
    setTimeout(() => setFeedback(''), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      {/* Title Header */}
      <div className="space-y-3 pb-6 border-b border-[#E5E5E0] dark:border-noir-border">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold font-mono">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>Saved Pieces</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white">
          Your Curated Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
          Keep track of your favorite ready-to-wear graphics and custom blank garments. Select your size and move directly into your bag when ready.
        </p>

        {feedback && (
          <div className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-mono rounded flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-noir-card border border-neutral-200 dark:border-noir-border flex items-center justify-center mx-auto text-neutral-400">
            <Heart className="w-7 h-7" />
          </div>
          <h2 className="font-editorial text-2xl font-semibold text-neutral-900 dark:text-white">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
            Explore our heavyweight combed cotton drops or create your personal design in the Print-on-Demand studio.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/shop"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-widest font-semibold hover:opacity-90 transition-opacity rounded"
            >
              Browse Shop Collection
            </Link>
            <Link
              to="/customize"
              className="px-6 py-3 border border-neutral-300 dark:border-noir-border text-neutral-800 dark:text-neutral-200 uppercase text-xs tracking-widest font-semibold hover:border-black dark:hover:border-white transition-colors rounded"
            >
              Open Custom Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((product) => {
            const chosenSize = selectedSizes[product._id] || 'L';
            const matchedVariant = product.variants?.find(v => v.size === chosenSize);
            const isOutOfStock = matchedVariant ? matchedVariant.stockQuantity <= 0 : false;
            const stockUnits = matchedVariant ? matchedVariant.stockQuantity : 25;

            return (
              <div
                key={product._id}
                className="group bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm p-4 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Image container */}
                  <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border rounded-sm overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(product._id, product.name)}
                      className="absolute top-2.5 right-2.5 p-2 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm rounded-full text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase border border-neutral-200 dark:border-noir-border">
                      {product.fabric?.gsm || 240} GSM
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                        !isOutOfStock
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {!isOutOfStock ? `In Stock (${stockUnits})` : 'Sold Out'}
                      </span>
                    </div>
                  </div>

                  {/* Product details */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-editorial text-lg font-semibold text-neutral-900 dark:text-white leading-tight">
                        <Link to={`/product/${product.slug}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </h3>
                      <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatPrice(product.basePricePaise)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {product.shortDescription || product.fabric?.material}
                    </p>
                  </div>

                  {/* Size selection */}
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block mb-1 font-mono uppercase tracking-wider">
                      Select Size
                    </label>
                    <div className="flex gap-1.5">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => handleSizeChange(product._id, sz)}
                          className={`flex-1 py-1 text-xs font-mono border rounded transition-colors ${
                            chosenSize === sz
                              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold'
                              : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 hover:border-black'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-noir-border">
                  <button
                    onClick={() => handleMoveToBag(product)}
                    disabled={addingId === product._id || isOutOfStock}
                    className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity rounded flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {addingId === product._id
                        ? 'Moving to Bag...'
                        : isOutOfStock
                        ? `Size ${chosenSize} Out of Stock`
                        : `Move Size ${chosenSize} to Bag`}
                    </span>
                  </button>

                  {product.isCustomizable && (
                    <Link
                      to={`/customize/${product._id}`}
                      className="w-full py-2 border border-neutral-300 dark:border-noir-border text-neutral-800 dark:text-neutral-200 uppercase text-[11px] tracking-wider font-semibold hover:border-black dark:hover:border-white transition-colors rounded flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                      <span>Customise in Studio</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
