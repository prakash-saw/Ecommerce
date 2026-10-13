import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Flame,
  Plus,
  Clock,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function AdminCollectionsDropsTab() {
  const [subTab, setSubTab] = useState('collections'); // 'collections' | 'drops'

  // Collections State
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colModalMode, setColModalMode] = useState('create');
  const [editingColId, setEditingColId] = useState(null);
  const [colForm, setColForm] = useState({
    name: '',
    slug: '',
    description: '',
    bannerImage: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1200&q=80',
    featuredOnHome: true,
    sortOrder: 0,
    status: 'published'
  });

  // Drops State (from existing drops model/endpoints)
  const [drops, setDrops] = useState([]);
  const [loadingDrops, setLoadingDrops] = useState(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [dropForm, setDropForm] = useState({
    title: '',
    slug: '',
    description: '',
    bannerImageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=80',
    launchAt: '',
    stockLimit: 50,
    status: 'scheduled'
  });

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const res = await apiRequest('/admin/collections');
      if (res.success) {
        setCollections(res.collections || []);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchDrops = async () => {
    try {
      setLoadingDrops(true);
      const res = await apiRequest('/drops');
      if (res.success) {
        setDrops(res.drops || []);
      }
    } catch (err) {
      console.error('Error fetching drops:', err);
    } finally {
      setLoadingDrops(false);
    }
  };

  useEffect(() => {
    if (subTab === 'collections') fetchCollections();
    else fetchDrops();
  }, [subTab]);

  const handleOpenCreateCollection = () => {
    setColModalMode('create');
    setEditingColId(null);
    setColForm({
      name: '',
      slug: '',
      description: 'Curated architectural garments celebrating minimalism and structure.',
      bannerImage: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1200&q=80',
      featuredOnHome: true,
      sortOrder: 0,
      status: 'published'
    });
    setIsColModalOpen(true);
  };

  const handleOpenEditCollection = (col) => {
    setColModalMode('edit');
    setEditingColId(col._id);
    setColForm({
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      bannerImage: col.bannerImage || '',
      featuredOnHome: Boolean(col.featuredOnHome),
      sortOrder: col.sortOrder || 0,
      status: col.status || 'published'
    });
    setIsColModalOpen(true);
  };

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (colModalMode === 'create') {
        res = await apiRequest('/admin/collections', {
          method: 'POST',
          body: JSON.stringify(colForm)
        });
      } else {
        res = await apiRequest(`/admin/collections/${editingColId}`, {
          method: 'PUT',
          body: JSON.stringify(colForm)
        });
      }

      if (res.success) {
        setIsColModalOpen(false);
        fetchCollections();
      } else {
        alert(res.message || 'Operation failed');
      }
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  };

  const handleDeleteCollection = async (id, name) => {
    if (!window.confirm(`Archive collection "${name}"?`)) return;
    try {
      const res = await apiRequest(`/admin/collections/${id}`, {
        method: 'DELETE'
      });
      if (res.success) fetchCollections();
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleCreateDrop = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/drops', {
        method: 'POST',
        body: JSON.stringify(dropForm)
      });
      if (res.success) {
        setIsDropModalOpen(false);
        fetchDrops();
      } else {
        alert(res.message || 'Failed to schedule drop');
      }
    } catch (err) {
      alert('Error creating drop: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Pill */}
      <div className="flex items-center justify-between bg-[#FDFCFA] dark:bg-[#151515] p-4 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
        <div className="flex items-center gap-2 bg-[#F2F2EE] dark:bg-[#202020] p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setSubTab('collections')}
            className={`px-4 py-1.5 rounded-lg transition ${
              subTab === 'collections'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Curated Collections
          </button>
          <button
            onClick={() => setSubTab('drops')}
            className={`px-4 py-1.5 rounded-lg transition ${
              subTab === 'drops'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Limited Edition Drops
          </button>
        </div>

        {subTab === 'collections' ? (
          <button
            onClick={handleOpenCreateCollection}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </button>
        ) : (
          <button
            onClick={() => setIsDropModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition shadow-2xs"
          >
            <Flame className="w-4 h-4" />
            <span>Schedule Limited Drop</span>
          </button>
        )}
      </div>

      {/* 1. COLLECTIONS TABLE */}
      {subTab === 'collections' && (
        <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
          {loadingCollections ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">Loading collections...</div>
          ) : collections.length > 0 ? (
            <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
              {collections.map((col) => (
                <div key={col._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={col.bannerImage}
                      alt={col.name}
                      className="w-20 h-14 object-cover rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-black text-sm text-[#111111] dark:text-white">{col.name}</h4>
                        {col.featuredOnHome && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 rounded font-bold">
                            HOME ROW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1">{col.description}</p>
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        Slug: /{col.slug} • Linked Products: {col.products?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        col.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {col.status}
                    </span>
                    <button
                      onClick={() => handleOpenEditCollection(col)}
                      className="p-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col._id, col.name)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-950/60 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">
              No custom collections created yet.
            </div>
          )}
        </div>
      )}

      {/* 2. DROPS TABLE */}
      {subTab === 'drops' && (
        <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
          {loadingDrops ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">Loading campaign drops...</div>
          ) : drops.length > 0 ? (
            <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
              {drops.map((d) => (
                <div key={d._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={d.bannerImageUrl}
                      alt={d.title}
                      className="w-20 h-14 object-cover rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-heading font-black text-sm text-[#111111] dark:text-white">{d.title}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-1">{d.description}</p>
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        Launch: {new Date(d.launchAt).toLocaleString('en-IN')} • Cap: {d.stockLimit || 50} units
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        d.status === 'live'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'ended'
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">
              No limited drops scheduled.
            </div>
          )}
        </div>
      )}

      {/* Collection Modal */}
      {isColModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-lg rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-[#222222] pb-3">
              <h3 className="text-base font-heading font-black text-[#111111] dark:text-white">
                {colModalMode === 'create' ? 'Create Collection' : 'Edit Collection'}
              </h3>
              <button onClick={() => setIsColModalOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={colForm.name}
                  onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                  placeholder="e.g. Heavyweight Boxy Essentials"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  value={colForm.slug}
                  onChange={(e) => setColForm({ ...colForm, slug: e.target.value })}
                  placeholder="auto-generated from name"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={colForm.bannerImage}
                  onChange={(e) => setColForm({ ...colForm, bannerImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={colForm.description}
                  onChange={(e) => setColForm({ ...colForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={colForm.featuredOnHome}
                    onChange={(e) => setColForm({ ...colForm, featuredOnHome: e.target.checked })}
                    className="rounded text-black focus:ring-0"
                  />
                  <span>Showcase on Homepage</span>
                </label>

                <div className="flex items-center gap-2 ml-auto">
                  <span>Status:</span>
                  <select
                    value={colForm.status}
                    onChange={(e) => setColForm({ ...colForm, status: e.target.value })}
                    className="px-2 py-1 rounded bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsColModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-lg"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drop Modal */}
      {isDropModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-lg rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-[#222222] pb-3">
              <h3 className="text-base font-heading font-black text-[#111111] dark:text-white">
                Schedule Limited-Edition Drop
              </h3>
              <button onClick={() => setIsDropModalOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrop} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Drop Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={dropForm.title}
                  onChange={(e) => setDropForm({ ...dropForm, title: e.target.value })}
                  placeholder="e.g. MONOCHROME NOIR DROP 01"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Launch Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dropForm.launchAt}
                    onChange={(e) => setDropForm({ ...dropForm, launchAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Strict Stock Limit</label>
                  <input
                    type="number"
                    value={dropForm.stockLimit}
                    onChange={(e) => setDropForm({ ...dropForm, stockLimit: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={dropForm.bannerImageUrl}
                  onChange={(e) => setDropForm({ ...dropForm, bannerImageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Campaign Narrative</label>
                <textarea
                  rows={2}
                  value={dropForm.description}
                  onChange={(e) => setDropForm({ ...dropForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-[#222222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDropModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E0E0DC] dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700"
                >
                  Schedule Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
