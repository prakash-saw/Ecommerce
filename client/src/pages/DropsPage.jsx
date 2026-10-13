import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Flame, Calendar, Sparkles, ArrowRight, Bell,
  CheckCircle2, AlertCircle, ShoppingBag
} from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';

export default function DropsPage() {
  const [dropsData, setDropsData] = useState({
    live: [],
    upcoming: [],
    ended: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'upcoming' | 'ended'

  // Email Notification modal/input state
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyingSlug, setNotifyingSlug] = useState(null);
  const [notifySuccess, setNotifySuccess] = useState('');
  const [notifyError, setNotifyError] = useState('');

  // Ticking countdown clock state (refreshes every second)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/drops');
      if (res.success && res.drops) {
        setDropsData(res.drops);
        if (res.drops.live?.length === 0 && res.drops.upcoming?.length > 0) {
          setActiveTab('upcoming');
        }
      }
    } catch (err) {
      console.error('Error fetching drops:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  const handleSubscribe = async (slug, e) => {
    e.preventDefault();
    setNotifyError('');
    setNotifySuccess('');
    if (!notifyEmail || !notifyEmail.includes('@')) {
      setNotifyError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await apiRequest(`/drops/${slug}/notify`, {
        method: 'POST',
        body: JSON.stringify({ email: notifyEmail })
      });
      if (res.success) {
        setNotifySuccess(res.message);
        setNotifyEmail('');
        setTimeout(() => {
          setNotifySuccess('');
          setNotifyingSlug(null);
        }, 4000);
      }
    } catch (err) {
      setNotifyError(err.message || 'Error subscribing to launch alerts.');
    }
  };

  // Helper to calculate countdown time units
  const calculateCountdown = (targetDateStr) => {
    const diff = new Date(targetDateStr).getTime() - now;
    if (diff <= 0) {
      return { days: 0, hours: 0, mins: 0, secs: 0, isPast: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return { days, hours, mins, secs, isPast: false };
  };

  const currentList = dropsData[activeTab] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-4 pb-6 border-b border-[#E5E5E0] dark:border-noir-border">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Curated Capsule Collections</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-6xl font-semibold text-neutral-900 dark:text-white leading-tight">
          Limited-Edition Drops
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl font-sans">
          Small-batch heavyweight drops and archival streetwear graphics. Each collection is released at an exact server timestamp with strictly verified stock limits.
        </p>

        {/* Tab Selection */}
        <div className="pt-4 flex gap-4 text-xs font-mono tracking-wider uppercase">
          {[
            { id: 'live', label: 'Live Drops', count: dropsData.live?.length || 0 },
            { id: 'upcoming', label: 'Upcoming Capsule', count: dropsData.upcoming?.length || 0 },
            { id: 'ended', label: 'Archived Past Drops', count: dropsData.ended?.length || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-black dark:border-white text-black dark:text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-noir-subtle">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-neutral-400 animate-pulse">
          Loading capsule collections and synchronizing server time...
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm p-8 space-y-3">
          <Clock className="w-8 h-8 mx-auto text-neutral-400" />
          <h3 className="font-editorial text-2xl font-semibold text-neutral-900 dark:text-white">
            No {activeTab} drops right now.
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Check the upcoming tab to see what capsule releases are currently in pre-press production.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className="text-xs font-mono uppercase tracking-widest underline hover:opacity-80"
            >
              View Upcoming Launches →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {currentList.map((drop) => {
            const countdown = calculateCountdown(drop.launchAt);
            const isLive = activeTab === 'live';
            const isUpcoming = activeTab === 'upcoming';

            return (
              <div
                key={drop._id}
                className="bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Hero Banner Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Left: Artwork Banner (7 cols) */}
                  <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto min-h-[320px] bg-neutral-900 overflow-hidden">
                    <img
                      src={drop.bannerImage}
                      alt={drop.title}
                      className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      {isLive && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-widest shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>Live Now</span>
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-3 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-widest">
                          Launching Soon
                        </span>
                      )}
                      {activeTab === 'ended' && (
                        <span className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 font-mono text-xs font-semibold uppercase tracking-widest">
                          Archived Collection
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Drop Story & Launch Mechanics (5 cols) */}
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                        Capsule ID: {drop.slug}
                      </span>
                      <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-white leading-tight">
                        {drop.title}
                      </h2>
                      {drop.tagline && (
                        <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                          {drop.tagline}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                        {drop.description}
                      </p>
                    </div>

                    {/* Launch Date & Countdown Display */}
                    <div className="p-4 rounded border border-neutral-200 dark:border-noir-border bg-neutral-50 dark:bg-noir-subtle space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-500">Official Launch:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {new Date(drop.launchAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Live Ticking Countdown Box */}
                      {isUpcoming && !countdown.isPast && (
                        <div className="space-y-1.5 pt-1 border-t border-neutral-200 dark:border-noir-border">
                          <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 block">
                            Launch Countdown:
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-center font-mono">
                            <div className="bg-white dark:bg-noir-card p-2 rounded border border-neutral-200 dark:border-noir-border">
                              <span className="text-lg font-bold text-neutral-900 dark:text-white block">
                                {countdown.days}
                              </span>
                              <span className="text-[9px] text-neutral-400 uppercase">Days</span>
                            </div>
                            <div className="bg-white dark:bg-noir-card p-2 rounded border border-neutral-200 dark:border-noir-border">
                              <span className="text-lg font-bold text-neutral-900 dark:text-white block">
                                {String(countdown.hours).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] text-neutral-400 uppercase">Hours</span>
                            </div>
                            <div className="bg-white dark:bg-noir-card p-2 rounded border border-neutral-200 dark:border-noir-border">
                              <span className="text-lg font-bold text-neutral-900 dark:text-white block">
                                {String(countdown.mins).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] text-neutral-400 uppercase">Mins</span>
                            </div>
                            <div className="bg-white dark:bg-noir-card p-2 rounded border border-neutral-200 dark:border-noir-border">
                              <span className="text-lg font-bold text-neutral-900 dark:text-white block text-amber-600 dark:text-amber-400">
                                {String(countdown.secs).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] text-neutral-400 uppercase">Secs</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notify Me Form for Upcoming Drop */}
                      {isUpcoming && (
                        <div className="pt-2">
                          {notifySuccess && notifyingSlug === drop.slug ? (
                            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>{notifySuccess}</span>
                            </div>
                          ) : (
                            <form
                              onSubmit={(e) => {
                                setNotifyingSlug(drop.slug);
                                handleSubscribe(drop.slug, e);
                              }}
                              className="flex gap-2"
                            >
                              <input
                                type="email"
                                placeholder="Enter email for drop alert..."
                                value={notifyingSlug === drop.slug ? notifyEmail : ''}
                                onFocus={() => setNotifyingSlug(drop.slug)}
                                onChange={(e) => setNotifyEmail(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border rounded bg-white dark:bg-noir-card border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black font-sans"
                                required
                              />
                              <button
                                type="submit"
                                className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black uppercase text-[10px] font-mono tracking-wider font-semibold rounded hover:opacity-90 flex items-center gap-1"
                              >
                                <Bell className="w-3 h-3" />
                                <span>Notify</span>
                              </button>
                            </form>
                          )}
                          {notifyError && notifyingSlug === drop.slug && (
                            <p className="text-[10px] text-red-500 mt-1">{notifyError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop Products Grid */}
                {drop.products && drop.products.length > 0 && (
                  <div className="p-6 sm:p-8 border-t border-neutral-100 dark:border-noir-border space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      Capsule Pieces & Verified Remaining Stock
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {drop.products.map((item, idx) => {
                        const prod = item.product;
                        if (!prod) return null;
                        const remaining = item.remainingStock;
                        const isSoldOut = item.isSoldOut;

                        return (
                          <div
                            key={idx}
                            className="border border-neutral-200 dark:border-noir-border rounded p-3 bg-neutral-50 dark:bg-noir-subtle flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="relative aspect-[4/5] bg-neutral-200 dark:bg-noir-card rounded overflow-hidden">
                                <img
                                  src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                                {isSoldOut && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="font-mono text-xs uppercase tracking-widest font-bold text-white bg-red-600 px-3 py-1 rounded">
                                      Sold Out
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="font-editorial text-base font-semibold text-neutral-900 dark:text-white leading-tight">
                                  {prod.name}
                                </h4>
                                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                                  {formatPrice(item.dropPricePaise || prod.basePricePaise)}
                                </span>
                              </div>

                              {/* Verified Remaining Stock Progress */}
                              {item.dropStockLimit ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                                    <span>Remaining:</span>
                                    <span className={remaining < 10 ? 'text-amber-600 font-bold' : ''}>
                                      {remaining} of {item.dropStockLimit} units
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-neutral-200 dark:bg-noir-border rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-black dark:bg-white rounded-full"
                                      style={{
                                        width: `${Math.min(100, Math.round(((item.dropStockLimit - remaining) / item.dropStockLimit) * 100))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  Printed-on-Demand (Tailored to order)
                                </p>
                              )}
                            </div>

                            {/* CTA */}
                            <div>
                              {isLive && !isSoldOut ? (
                                <Link
                                  to={`/product/${prod.slug}`}
                                  className="w-full py-2 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold rounded hover:opacity-90 flex items-center justify-center gap-1.5"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Acquire Piece</span>
                                </Link>
                              ) : isUpcoming ? (
                                <div className="w-full py-2 border border-neutral-300 dark:border-noir-border text-center text-[11px] font-mono uppercase tracking-wider text-neutral-500 rounded">
                                  Pre-Launch Preview
                                </div>
                              ) : (
                                <div className="w-full py-2 bg-neutral-200 dark:bg-noir-border text-center text-[11px] font-mono uppercase tracking-wider text-neutral-400 rounded">
                                  Archived
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
