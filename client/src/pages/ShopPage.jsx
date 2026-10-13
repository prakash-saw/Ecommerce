import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ArrowUpDown, Heart, X, Check,
  ChevronLeft, ChevronRight, Star, RefreshCw, Filter
} from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';
import { useWishlist } from '../context/WishlistContext';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  { id: 'white', name: 'White', hex: '#FFFFFF', border: '#D4D4D8' },
  { id: 'black', name: 'Black', hex: '#111111', border: '#000000' },
  { id: 'off-white', name: 'Vintage Off-White', hex: '#F5F4EE', border: '#DCDAD0' },
  { id: 'charcoal', name: 'Charcoal', hex: '#262626', border: '#171717' },
  { id: 'navy', name: 'Navy', hex: '#1B263B', border: '#101724' },
  { id: 'forest', name: 'Forest', hex: '#16382B', border: '#0C2018' }
];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Read URL params
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSize = searchParams.get('size') || '';
  const selectedColor = searchParams.get('color') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const minRating = searchParams.get('minRating') || '';
  const sortBy = searchParams.get('sortBy') || 'featured';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search input text
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Sync searchInput if URL changes externally
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Update query params helper
  const updateFilter = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '' || val === 'all') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      // Reset page to 1 unless page itself was updated
      if (!updates.page) {
        next.delete('page');
      }
      return next;
    });
  }, [setSearchParams]);

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter({ search: searchInput.trim() });
  };

  // Fetch products whenever searchParams change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    if (!params.get('limit')) params.set('limit', '12');

    apiRequest(`/products?${params.toString()}`)
      .then((res) => {
        if (res.success) {
          setProducts(res.products || []);
          setTotalCount(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      })
      .catch((err) => console.error('Fetch catalogue error:', err))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== 'all' ? selectedCategory : '',
    selectedSize,
    selectedColor,
    minPrice,
    maxPrice,
    inStockOnly ? 'inStock' : '',
    minRating
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      {/* Editorial Header */}
      <div className="space-y-4 pb-6 border-b border-[#E5E5E0] dark:border-noir-border">
        <span className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
          The Catalogue
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white">
          Ready-to-Wear & Atelier Blanks
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
          Crafted from 240+ GSM bio-washed Indian organic cotton. Designed with streetwear drop shoulders and architectural typography.
        </p>

        {/* Search Bar & Quick Categories */}
        <div className="pt-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, fabric, tags, category..."
              className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilter({ search: '' });
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black text-[11px] font-semibold rounded uppercase tracking-wider"
              >
                Go
              </button>
            </div>
          </form>

          {/* Mobile Filter Toggle & Sort Selector */}
          <div className="flex items-center gap-3 justify-between md:justify-end">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-neutral-300 dark:border-noir-border rounded text-xs font-semibold text-neutral-800 dark:text-neutral-200"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => updateFilter({ sortBy: e.target.value })}
                className="p-2 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-card text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none"
              >
                <option value="featured">Featured First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest Releases</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Drawer / Bar */}
        <div className={`pt-4 space-y-4 border-t border-neutral-200 dark:border-noir-border ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 font-semibold mr-1">Category:</span>
            {[
              { id: 'all', label: 'All Garments' },
              { id: 'ready_to_wear', label: 'Ready-to-Wear' },
              { id: 'custom_blank', label: 'POD Blanks' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter({ category: cat.id })}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-white dark:bg-noir-card text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Multi-attribute Filters Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            {/* Sizes */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 dark:text-neutral-400 font-semibold mr-1">Size:</span>
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateFilter({ size: selectedSize === s ? '' : s })}
                  className={`w-7 h-7 rounded border font-mono text-[11px] font-semibold transition-colors ${
                    selectedSize === s
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'bg-white dark:bg-noir-card text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-noir-border hover:border-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Colours */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 dark:text-neutral-400 font-semibold mr-1">Colour:</span>
              {COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => updateFilter({ color: selectedColor === col.id ? '' : col.id })}
                  title={col.name}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    selectedColor === col.id ? 'scale-125 ring-2 ring-black dark:ring-white ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: col.hex, borderColor: col.border }}
                />
              ))}
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 dark:text-neutral-400 font-semibold mr-1">Price (₹):</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateFilter({ minPrice: e.target.value })}
                className="w-16 px-2 py-1 bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border rounded text-xs focus:outline-none"
              />
              <span className="text-neutral-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateFilter({ maxPrice: e.target.value })}
                className="w-16 px-2 py-1 bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border rounded text-xs focus:outline-none"
              />
            </div>

            {/* In Stock toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateFilter({ inStock: e.target.checked ? 'true' : '' })}
                className="rounded border-neutral-300 text-black focus:ring-0"
              />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">In Stock Only</span>
            </label>

            {/* Clear All */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 underline ml-auto text-xs"
              >
                Reset All Filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalogue Results & Product Grid */}
      <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
        <span>Showing {products.length} of {totalCount} items</span>
        {searchQuery && (
          <span>Search query: &ldquo;{searchQuery}&rdquo;</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 dark:bg-noir-card animate-pulse rounded-sm" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-neutral-300 dark:border-noir-border rounded-sm space-y-4 bg-white dark:bg-noir-card">
          <p className="font-editorial text-2xl italic text-neutral-800 dark:text-neutral-200">No Garments Found</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            No active catalogue items matched your active search query or filter criteria. Try resetting filters or browsing all garments.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 border border-neutral-300 dark:border-noir-border text-xs uppercase tracking-wider font-semibold rounded hover:border-black"
            >
              Reset Filters
            </button>
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
          {products.map((p) => {
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-8 flex items-center justify-center gap-2 border-t border-neutral-200 dark:border-noir-border">
          <button
            disabled={currentPage <= 1}
            onClick={() => updateFilter({ page: currentPage - 1 })}
            className="p-2 border border-neutral-300 dark:border-noir-border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:border-black"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => updateFilter({ page: pg })}
              className={`w-8 h-8 rounded text-xs font-mono font-semibold transition-colors ${
                currentPage === pg
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'border border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 hover:border-black'
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => updateFilter({ page: currentPage + 1 })}
            className="p-2 border border-neutral-300 dark:border-noir-border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:border-black"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
