import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, SlidersHorizontal, ArrowUpDown, Heart } from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';
import { useWishlist } from '../context/WishlistContext';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const selectedCategory = searchParams.get('category') || 'all';
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    apiRequest('/products')
      .then((res) => {
        if (res.success) setProducts(res.products);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  }).sort((a, b) => {
    if (sortBy === 'price_low') return a.basePricePaise - b.basePricePaise;
    if (sortBy === 'price_high') return b.basePricePaise - a.basePricePaise;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-10">
      {/* Editorial Title & Filter Header */}
      <div className="space-y-4 pb-6 border-b border-[#E5E5E0] dark:border-noir-border">
        <span className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">The Catalogue</span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white">
          Ready-to-Wear & Atelier Blanks
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
          Crafted from 240+ GSM bio-washed Indian organic cotton. Designed with streetwear drop shoulders and clean architectural graphics.
        </p>

        {/* Filter Bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <button
              onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-noir-card text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black dark:hover:border-white'
              }`}
            >
              All Garments ({products.length})
            </button>
            <button
              onClick={() => setSearchParams({ category: 'ready_to_wear' })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === 'ready_to_wear'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-noir-card text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black dark:hover:border-white'
              }`}
            >
              Printed Ready-to-Wear
            </button>
            <button
              onClick={() => setSearchParams({ category: 'custom_blank' })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === 'custom_blank'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-noir-card text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black dark:hover:border-white'
              }`}
            >
              POD Custom Blanks
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-card text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none"
            >
              <option value="featured">Featured First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 dark:bg-noir-card animate-pulse rounded-sm" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-neutral-300 dark:border-noir-border rounded-sm space-y-4 bg-white dark:bg-noir-card">
          <p className="font-editorial text-2xl italic text-neutral-800 dark:text-neutral-200">Catalogue Currently Empty</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            {selectedCategory === 'all'
              ? 'No ready-to-wear products are published yet. New collections will appear here once added through the Admin Studio.'
              : `No garments found in category "${selectedCategory}".`}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSearchParams({})}
                className="px-5 py-2.5 border border-neutral-300 dark:border-noir-border text-xs uppercase tracking-wider font-semibold rounded hover:border-black"
              >
                Clear Category Filter
              </button>
            )}
            <Link
              to="/customize"
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-wider font-semibold rounded"
            >
              Open Custom POD Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredProducts.map((p) => {
            const wishlisted = isInWishlist(p._id);
            return (
              <div key={p._id} className="group flex flex-col space-y-4">
                <div className="block relative aspect-[4/5] bg-neutral-100 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border overflow-hidden rounded-sm">
                  <Link to={`/product/${p.slug}`} className="block w-full h-full">
                    <img
                      src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Wishlist quick-toggle button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(p);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm rounded-full text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                    title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border border-neutral-200 dark:border-noir-border text-neutral-900 dark:text-neutral-100">
                    {p.fabric?.gsm || 240} GSM
                  </div>
                  {p.isCustomizable && (
                    <div className="absolute bottom-3 left-3 bg-neutral-900 dark:bg-white text-white dark:text-black px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded">
                      POD Available
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-editorial text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                      <Link to={`/product/${p.slug}`}>{p.name}</Link>
                    </h3>
                    <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatPrice(p.basePricePaise)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{p.shortDescription}</p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      {p.fabric?.material || '100% Combed Cotton'}
                    </span>
                    <Link
                      to={p.isCustomizable ? `/customize/${p._id}` : `/product/${p.slug}`}
                      className="text-[11px] uppercase tracking-wider font-semibold hover:underline text-neutral-900 dark:text-neutral-100 flex items-center gap-1"
                    >
                      {p.isCustomizable ? 'Customize Tee' : 'View Garment'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
