import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Shield,
  Phone,
  Mail,
  Truck,
  Bell,
  CheckCircle2,
  Lock,
  Key,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { apiRequest, formatPrice } from '../../api/client';

export default function AdminSettingsTab({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    storeName: 'BLANC ATELIER',
    tagline: 'Architectural Minimalist Streetwear & Studio POD',
    contactEmail: 'concierge@blancatelier.com',
    whatsappNumber: '+91 98765 43210',
    currency: 'INR',
    lowStockThreshold: 10,
    freeShippingThresholdRupees: 999,
    announcementText: 'Complimentary standard shipping on all orders over ₹999 across India.',
    announcementActive: true,
    returnWindowDays: 7
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/settings');
      if (res.success && res.settings) {
        const s = res.settings;
        setForm({
          storeName: s.storeName || 'BLANC ATELIER',
          tagline: s.tagline || '',
          contactEmail: s.contactEmail || 'concierge@blancatelier.com',
          whatsappNumber: s.whatsappNumber || '+91 98765 43210',
          currency: s.currency || 'INR',
          lowStockThreshold: s.lowStockThreshold || 10,
          freeShippingThresholdRupees: (s.freeShippingThresholdPaise || 99900) / 100,
          announcementText: s.announcementText || '',
          announcementActive: Boolean(s.announcementActive),
          returnWindowDays: s.returnWindowDays || 7
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const payload = {
        storeName: form.storeName,
        tagline: form.tagline,
        contactEmail: form.contactEmail,
        whatsappNumber: form.whatsappNumber,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        freeShippingThresholdPaise: Math.round(parseFloat(form.freeShippingThresholdRupees) * 100),
        announcementText: form.announcementText,
        announcementActive: form.announcementActive,
        returnWindowDays: parseInt(form.returnWindowDays, 10)
      };

      const res = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.message || 'Failed to save settings');
      }
    } catch (err) {
      alert('Settings error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-neutral-400">
        Loading operational configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black tracking-tight text-[#111111] dark:text-white">
            Storewide Operational Controls
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure contact coordinates, logistics thresholds, and live storefront announcements.
          </p>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Changes Applied
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Brand & Contact Coordinates */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] space-y-4">
          <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-neutral-400" /> Brand Identity & Contact Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Brand Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Brand Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Concierge Support Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Concierge Number
              </label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Threshold Preferences */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] space-y-4">
          <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-neutral-400" /> Thresholds & Fulfilment Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Free Shipping Basket (₹)
              </label>
              <input
                type="number"
                value={form.freeShippingThresholdRupees}
                onChange={(e) => setForm({ ...form, freeShippingThresholdRupees: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Free delivery applied when subtotal ≥ this amount.</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Low-Stock Alert Trigger
              </label>
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Triggers dashboard warning when units drop below.</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Return Window (Days)
              </label>
              <input
                type="number"
                value={form.returnWindowDays}
                onChange={(e) => setForm({ ...form, returnWindowDays: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Standard customer policy limit.</p>
            </div>
          </div>
        </div>

        {/* Storefront Announcement Bar */}
        <div className="bg-[#FDFCFA] dark:bg-[#151515] p-6 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-[#111111] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-neutral-400" /> Header Announcement Banner
            </h3>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.announcementActive}
                onChange={(e) => setForm({ ...form, announcementActive: e.target.checked })}
                className="rounded text-black focus:ring-0"
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div>
            <input
              type="text"
              value={form.announcementText}
              onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
              placeholder="e.g. Complimentary standard shipping on all orders over ₹999 across India."
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
            />
          </div>
        </div>

        {/* Security & Action Save */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-950/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Administrator Session</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
