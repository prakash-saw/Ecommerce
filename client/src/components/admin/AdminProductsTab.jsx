import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminProductsTab({ onPreviewProduct }) {
  // Products list state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selected products for bulk action
  const [selectedIds, setSelectedIds] = useState([]);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeFormTab, setActiveFormTab] = useState('basics'); // 'basics' | 'variants' | 'fabric' | 'sizechart' | 'seo'
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    basePriceRupees: '799',
    compareAtPriceRupees: '1299',
    costPriceRupees: '320',
    category: 'ready_to_wear',
    tags: 'oversized, streetwear, organic',
    productType: 'ready_to_wear',
    status: 'published',
    featured: false,
    isCustomizable: false,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    backImageUrl: '',
    fabricGsm: 240,
    fabricMaterial: '100% Combed Organic Cotton',
    fabricFit: 'Relaxed Boxy / Drop Shoulder',
    fabricFinish: 'Bio-Washed Pre-Shrunk Single Jersey',
    seoTitle: '',
    seoDescription: '',
    variants: [
      { size: 'S', stockQuantity: 20, sku: '' },
      { size: 'M', stockQuantity: 25, sku: '' },
      { size: 'L', stockQuantity: 25, sku: '' },
      { size: 'XL', stockQuantity: 15, sku: '' },
      { size: 'XXL', stockQuantity: 10, sku: '' }
    ]
  });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy
      });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('productType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (stockFilter) params.append('stockStatus', stockFilter);

      const res = await apiRequest(`/admin/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [categoryFilter, typeFilter, statusFilter, stockFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormError('');
    setActiveFormTab('basics');
    setFormState({
      name: '',
      slug: '',
      description: 'Engineered from heavyweight 240 GSM combed organic cotton with relaxed architectural drop-shoulder cut.',
      shortDescription: 'Heavyweight organic cotton boxy streetwear tee.',
      basePriceRupees: '899',
      compareAtPriceRupees: '1499',
      costPriceRupees: '350',
      category: 'ready_to_wear',
      tags: 'oversized, streetwear, organic',
      productType: 'ready_to_wear',
      status: 'published',
      featured: false,
      isCustomizable: false,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      backImageUrl: '',
      fabricGsm: 240,
      fabricMaterial: '100% Combed Organic Cotton',
      fabricFit: 'Relaxed Boxy / Drop Shoulder',
      fabricFinish: 'Bio-Washed Pre-Shrunk Single Jersey',
      seoTitle: '',
      seoDescription: '',
      variants: [
        { size: 'S', stockQuantity: 20, sku: '' },
        { size: 'M', stockQuantity: 25, sku: '' },
        { size: 'L', stockQuantity: 25, sku: '' },
        { size: 'XL', stockQuantity: 15, sku: '' },
        { size: 'XXL', stockQuantity: 10, sku: '' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (productId) => {
    try {
      setModalMode('edit');
      setEditingId(productId);
      setFormError('');
      setActiveFormTab('basics');
      const res = await apiRequest(`/admin/products/${productId}`);
      if (res.success && res.product) {
        const p = res.product;
        setFormState({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          basePriceRupees: String((p.basePricePaise || 0) / 100),
          compareAtPriceRupees: p.compareAtPricePaise ? String(p.compareAtPricePaise / 100) : '',
          costPriceRupees: p.costPricePaise ? String(p.costPricePaise / 100) : '',
          category: p.category || 'ready_to_wear',
          tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
          productType: p.productType || 'ready_to_wear',
          status: p.status || 'published',
          featured: Boolean(p.featured),
          isCustomizable: Boolean(p.isCustomizable),
          imageUrl: p.images?.[0]?.url || '',
          backImageUrl: p.images?.find(i => i.view === 'back')?.url || '',
          fabricGsm: p.fabric?.gsm || 240,
          fabricMaterial: p.fabric?.material || '100% Combed Organic Cotton',
          fabricFit: p.fabric?.fit || 'Relaxed Boxy / Drop Shoulder',
          fabricFinish: p.fabric?.finish || 'Bio-Washed Pre-Shrunk Single Jersey',
          seoTitle: p.seoTitle || '',
          seoDescription: p.seoDescription || '',
          variants: (p.variants || []).map(v => ({
            _id: v._id,
            size: v.size,
            sku: v.sku,
            stockQuantity: v.stockQuantity,
            color: v.color
          }))
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching product: ' + err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');

      const basePricePaise = Math.round(parseFloat(formState.basePriceRupees) * 100);
      const compareAtPricePaise = formState.compareAtPriceRupees
        ? Math.round(parseFloat(formState.compareAtPriceRupees) * 100)
        : null;
      const costPricePaise = formState.costPriceRupees
        ? Math.round(parseFloat(formState.costPriceRupees) * 100)
        : null;

      if (!formState.name || isNaN(basePricePaise) || basePricePaise <= 0) {
        setFormError('Please enter a valid product name and base price.');
        setSubmitting(false);
        return;
      }

      const images = [
        {
          url: formState.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          alt: formState.name,
          isPrimary: true,
          view: 'front'
        }
      ];

      if (formState.backImageUrl) {
        images.push({
          url: formState.backImageUrl,
          alt: `${formState.name} Back`,
          isPrimary: false,
          view: 'back'
        });
      }

      const payload = {
        name: formState.name,
        slug: formState.slug || undefined,
        description: formState.description,
        shortDescription: formState.shortDescription,
        basePricePaise,
        compareAtPricePaise,
        costPricePaise,
        category: formState.category,
        tags: formState.tags.split(',').map(t => t.trim()).filter(Boolean),
        productType: formState.productType,
        status: formState.status,
        featured: formState.featured,
        isCustomizable: formState.isCustomizable,
        images,
        fabric: {
          gsm: Number(formState.fabricGsm) || 240,
          material: formState.fabricMaterial,
          fit: formState.fabricFit,
          finish: formState.fabricFinish
        },
        seoTitle: formState.seoTitle,
        seoDescription: formState.seoDescription,
        variants: formState.variants
      };

      let res;
      if (modalMode === 'create') {
        res = await apiRequest('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiRequest(`/admin/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchProducts(pagination.page);
      } else {
        setFormError(res.message || 'Operation failed on server.');
      }
    } catch (err) {
      setFormError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (productId, productName) => {
    if (!window.confirm(`Archive "${productName}"? Historical orders and customer reviews will be preserved, but the item will be removed from public storefront sales.`)) {
      return;
    }
    try {
      const res = await apiRequest(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        fetchProducts(pagination.page);
      }
    } catch (err) {
      alert('Archive error: ' + err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Apply ${action} to ${selectedIds.length} selected products?`)) return;

    try {
      const res = await apiRequest('/admin/products/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids: selectedIds, action })
      });
      if (res.success) {
        setSelectedIds([]);
        fetchProducts(pagination.page);
      }
    } catch (err) {
      alert('Bulk action error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, slug, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F2F2EE] dark:bg-[#202020] border-none rounded-xl text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-neutral-400"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-medium hover:opacity-90 transition"
          >
            Filter
          </button>
        </form>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-neutral-800 p-1 rounded-xl border border-[#EAEAE6] dark:border-[#282828]">
              <span className="text-[11px] font-mono px-2 text-neutral-500">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-2.5 py-1 text-[11px] font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
              >
                Archive
              </button>
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New T-Shirt</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-[#F2F2EE] dark:bg-[#202020] p-1 rounded-xl">
          {[
            { id: '', label: 'All Status' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'archived', label: 'Archived' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === item.id
                  ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
        >
          <option value="">All Inventory Levels</option>
          <option value="in_stock">In Stock (&gt;10)</option>
          <option value="low_stock">Low Stock (≤10)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
        </select>

        {/* Product Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#FDFCFA] dark:bg-[#151515] border border-[#EAEAE6] dark:border-[#222222] rounded-xl px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
        >
          <option value="">All Product Types</option>
          <option value="ready_to_wear">Ready-to-Wear</option>
          <option value="custom_blank">POD Customizable Blank</option>
          <option value="limited_drop">Limited Drop</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-2" />
            Loading catalogue matrix...
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(products.map(p => p._id));
                        else setSelectedIds([]);
                      }}
                      className="rounded text-black focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Variants / Stock</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {products.map((prod) => {
                  const isSelected = selectedIds.includes(prod._id);
                  const primaryImage = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';

                  return (
                    <tr
                      key={prod._id}
                      className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition ${
                        isSelected ? 'bg-neutral-50 dark:bg-neutral-800/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, prod._id]);
                            else setSelectedIds(selectedIds.filter(id => id !== prod._id));
                          }}
                          className="rounded text-black focus:ring-0"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImage}
                            alt={prod.name}
                            className="w-12 h-14 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#111111] dark:text-white">
                                {prod.name}
                              </span>
                              {prod.featured && (
                                <span className="px-1.5 py-0.2 text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 rounded">
                                  FEATURED
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-neutral-400">
                              /{prod.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#111111] dark:text-white">
                          {formatPrice(prod.basePricePaise)}
                        </div>
                        {prod.costPricePaise && (
                          <div className="text-[10px] font-mono text-neutral-400" title="Cost of Goods (Admin only)">
                            Cost: {formatPrice(prod.costPricePaise)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              prod.stockStatus === 'out_of_stock'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : prod.stockStatus === 'low_stock'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {prod.totalStock} units
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({prod.variantCount} sizes)
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                          {prod.productType?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                            prod.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : prod.status === 'draft'
                              ? 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(prod._id)}
                            className="p-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="Edit product specs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(prod._id, prod.name)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Archive product (Safe delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-400 font-mono">
            No products match the selected criteria.
          </div>
        )}

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded border border-[#E0E0DC] dark:border-neutral-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-3xl rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-black text-[#111111] dark:text-white">
                  {modalMode === 'create' ? 'Create New T-Shirt Silhouette' : `Edit Product: ${formState.name}`}
                </h3>
                <p className="text-xs text-neutral-400">Configure sizing, variants, pricing, and architectural fabric specifications.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#EAEAE6] dark:border-[#222222] text-xs font-medium">
              {[
                { id: 'basics', label: '1. Basics & Pricing' },
                { id: 'variants', label: '2. Variants & Stock' },
                { id: 'fabric', label: '3. Fabric & Care' },
                { id: 'seo', label: '4. SEO & Visibility' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`pb-2.5 px-2 border-b-2 transition ${
                    activeFormTab === tab.id
                      ? 'border-black dark:border-white text-black dark:text-white font-bold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                  {formError}
                </div>
              )}

              {/* Tab 1: Basics & Pricing */}
              {activeFormTab === 'basics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Architectural Boxy Tee"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">URL Slug</label>
                      <input
                        type="text"
                        value={formState.slug}
                        onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                        placeholder="auto-generated from title"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Retail Price (₹ INR) *</label>
                      <input
                        type="number"
                        required
                        value={formState.basePriceRupees}
                        onChange={(e) => setFormState({ ...formState, basePriceRupees: e.target.value })}
                        placeholder="799"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Compare Price (₹)</label>
                      <input
                        type="number"
                        value={formState.compareAtPriceRupees}
                        onChange={(e) => setFormState({ ...formState, compareAtPriceRupees: e.target.value })}
                        placeholder="1299"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Cost of Goods (₹)</label>
                      <input
                        type="number"
                        value={formState.costPriceRupees}
                        onChange={(e) => setFormState({ ...formState, costPriceRupees: e.target.value })}
                        placeholder="320"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Description</label>
                    <textarea
                      rows={3}
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Primary Front Image URL</label>
                      <input
                        type="url"
                        value={formState.imageUrl}
                        onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Back View Image URL</label>
                      <input
                        type="url"
                        value={formState.backImageUrl}
                        onChange={(e) => setFormState({ ...formState, backImageUrl: e.target.value })}
                        placeholder="Optional back angle"
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Category</label>
                      <select
                        value={formState.category}
                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      >
                        <option value="ready_to_wear">Ready to Wear</option>
                        <option value="oversized">Oversized Silhouette</option>
                        <option value="heavyweight">Heavyweight Series</option>
                        <option value="limited_edition">Limited Drop</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Product Type</label>
                      <select
                        value={formState.productType}
                        onChange={(e) => setFormState({ ...formState, productType: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      >
                        <option value="ready_to_wear">Ready-to-Wear</option>
                        <option value="custom_blank">POD Customizable Blank</option>
                        <option value="limited_drop">Limited Drop</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Publication Status</label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Variants & Stock */}
              {activeFormTab === 'variants' && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500">
                    Set individual inventory levels for each standard size combination. Adjustments will automatically be recorded in the audit history.
                  </p>
                  <div className="border border-[#EAEAE6] dark:border-[#222222] rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Stock Units</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                        {formState.variants.map((v, idx) => (
                          <tr key={v.size}>
                            <td className="py-2.5 px-3 font-bold font-mono">{v.size}</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                placeholder={`BLC-${v.size}`}
                                value={v.sku || ''}
                                onChange={(e) => {
                                  const updated = [...formState.variants];
                                  updated[idx].sku = e.target.value;
                                  setFormState({ ...formState, variants: updated });
                                }}
                                className="w-full px-2 py-1 rounded bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={v.stockQuantity}
                                onChange={(e) => {
                                  const updated = [...formState.variants];
                                  updated[idx].stockQuantity = parseInt(e.target.value, 10) || 0;
                                  setFormState({ ...formState, variants: updated });
                                }}
                                className="w-24 px-2 py-1 rounded bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Fabric & Care */}
              {activeFormTab === 'fabric' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Fabric Weight (GSM)</label>
                      <input
                        type="number"
                        value={formState.fabricGsm}
                        onChange={(e) => setFormState({ ...formState, fabricGsm: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Material Composition</label>
                      <input
                        type="text"
                        value={formState.fabricMaterial}
                        onChange={(e) => setFormState({ ...formState, fabricMaterial: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Fit Description</label>
                      <input
                        type="text"
                        value={formState.fabricFit}
                        onChange={(e) => setFormState({ ...formState, fabricFit: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Finishing Process</label>
                      <input
                        type="text"
                        value={formState.fabricFinish}
                        onChange={(e) => setFormState({ ...formState, fabricFinish: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: SEO & Visibility */}
              {activeFormTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">SEO Page Title</label>
                    <input
                      type="text"
                      value={formState.seoTitle}
                      onChange={(e) => setFormState({ ...formState, seoTitle: e.target.value })}
                      placeholder="e.g. Heavyweight Minimalist Boxy T-Shirt | BLANC ATELIER"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Meta Description</label>
                    <textarea
                      rows={2}
                      value={formState.seoDescription}
                      onChange={(e) => setFormState({ ...formState, seoDescription: e.target.value })}
                      placeholder="Crafted from 240 GSM pre-shrunk cotton in India..."
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.featured}
                        onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                        className="rounded text-black focus:ring-0"
                      />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Show in Homepage Featured Row</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.isCustomizable}
                        onChange={(e) => setFormState({ ...formState, isCustomizable: e.target.checked })}
                        className="rounded text-black focus:ring-0"
                      />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Enable in Studio POD Customizer</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E0E0DC] dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Publish T-Shirt' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
