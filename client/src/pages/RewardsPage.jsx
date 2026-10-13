import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Copy, Check, Users, Sparkles, ArrowRight,
  ShieldAlert, Clock, Tag, MessageSquare, AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RewardsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Redemption State
  const [redeemPoints, setRedeemPoints] = useState(100);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/rewards/me');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRewards();
  }, [user]);

  const referralLink = data?.account?.referralCode
    ? `${window.location.origin}/shop?ref=${data.account.referralCode}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');
    try {
      setRedeemLoading(true);
      const res = await apiRequest('/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ pointsToRedeem: redeemPoints })
      });
      if (res.success) {
        setRedeemSuccess(`Voucher ${res.coupon.code} created for ₹${res.coupon.discountRupees} off! Valid for 30 days.`);
        fetchRewards();
      }
    } catch (err) {
      setRedeemError(err.message || 'Error redeeming points');
    } finally {
      setRedeemLoading(false);
    }
  };

  const shareWhatsAppMessage = `Hey, check out BLANC ATELIER for heavyweight minimal t-shirts and custom POD designs. Use my referral code ${data?.account?.referralCode || ''} for ${data?.config?.referredDiscountPercent || 10}% off your first order: ${referralLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareWhatsAppMessage)}`;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-noir-card border border-neutral-200 dark:border-noir-border flex items-center justify-center mx-auto text-neutral-600 dark:text-neutral-400">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white">
          BLANC Atelier Rewards Circle
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto font-sans leading-relaxed">
          Sign in to earn 5 points for every ₹100 spent, invite fellow streetwear collectors for exclusive credit, and redeem points for checkout discounts.
        </p>
        <div className="pt-2">
          <Link
            to="/account"
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs font-mono tracking-widest font-semibold rounded hover:opacity-90 inline-block"
          >
            Sign In or Register
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-xs text-neutral-400 animate-pulse">
        Synchronizing rewards ledger and referral bonuses...
      </div>
    );
  }

  const { account, config, availableCoupons } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-3 pb-6 border-b border-[#E5E5E0] dark:border-noir-border">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
          <Gift className="w-4 h-4 text-amber-500" />
          <span>Loyalty & Referral Circle</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white">
          Atelier Credit & Rewards
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl font-sans">
          Earn margin-aware points on every completed order. Share your personal invitation code with friends and convert points into checkout discount vouchers.
        </p>
      </div>

      {/* Top Highlight Cards: Points Balance & Referral Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points Balance Card */}
        <div className="p-6 bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Your Available Credit
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active Circle
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-5xl font-bold text-neutral-900 dark:text-white">
                {account?.pointsBalance || 0}
              </span>
              <span className="text-xs font-mono text-neutral-500 uppercase">Points</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
              Equivalent to ₹{account?.monetaryValueRupees || 0} in Atelier checkout credit (1 pt = ₹1)
            </p>
          </div>

          {/* Quick Redeem Bar */}
          <div className="pt-2 border-t border-neutral-100 dark:border-noir-border space-y-3">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
              Convert Points to Discount Voucher
            </h4>
            {redeemSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-1.5 font-mono">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{redeemSuccess}</span>
              </div>
            )}
            {redeemError && (
              <p className="text-xs text-red-600 font-mono">✕ {redeemError}</p>
            )}
            <form onSubmit={handleRedeem} className="flex gap-2">
              <select
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Number(e.target.value))}
                className="px-3 py-2 border rounded bg-white dark:bg-noir-card border-neutral-300 dark:border-noir-border text-xs font-mono"
              >
                <option value={50}>50 Points (₹50 Off)</option>
                <option value={100}>100 Points (₹100 Off)</option>
                <option value={200}>200 Points (₹200 Off)</option>
                <option value={500}>500 Points (₹500 Off)</option>
              </select>
              <button
                type="submit"
                disabled={redeemLoading || (account?.pointsBalance || 0) < redeemPoints}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black uppercase text-xs font-mono tracking-wider font-semibold rounded hover:opacity-90 disabled:opacity-40"
              >
                {redeemLoading ? 'Generating...' : 'Redeem Voucher'}
              </button>
            </form>
          </div>
        </div>

        {/* Unique Referral Card */}
        <div className="p-6 bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Invite A Fellow Collector
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-noir-subtle text-neutral-700 dark:text-neutral-300">
                +{config?.referrerBonusPoints || 150} Pts Reward
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-editorial text-2xl font-semibold text-neutral-900 dark:text-white">
                Code: {account?.referralCode}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Give your friends {config?.referredDiscountPercent || 10}% off their first order (min ₹{config?.minOrderValuePaise / 100 || 999}). Once their order is delivered, you earn {config?.referrerBonusPoints || 150} points (₹{config?.referrerBonusPoints || 150}).
              </p>
            </div>

            {/* Referral Link Copy Bar */}
            <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border rounded">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 text-xs font-mono bg-transparent border-none focus:outline-none text-neutral-700 dark:text-neutral-300 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black uppercase text-[10px] font-mono tracking-wider font-semibold rounded hover:opacity-90 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 border border-emerald-600 text-emerald-700 dark:text-emerald-400 uppercase text-xs font-mono tracking-wider font-semibold rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share Invitation on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Active Generated Coupons */}
      {availableCoupons && availableCoupons.length > 0 && (
        <div className="space-y-3 p-5 bg-neutral-50 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border rounded">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
              Your Unused Reward Discount Vouchers
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableCoupons.map((c, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-noir-card border border-neutral-300 dark:border-noir-border rounded flex justify-between items-center"
              >
                <div>
                  <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white block">
                    {c.code}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    ₹{c.discountPaise / 100} Off (Min ₹{c.minOrderValuePaise / 100})
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(c.code);
                    alert(`Copied ${c.code} to clipboard! Paste at checkout.`);
                  }}
                  className="text-[10px] uppercase font-mono tracking-wider underline hover:text-black"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Status & History Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Points Transaction Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-editorial text-2xl font-semibold text-neutral-900 dark:text-white">
            Points Ledger & Activity
          </h3>

          <div className="border border-[#E5E5E0] dark:border-noir-border rounded overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-noir-subtle font-mono text-[11px] text-neutral-500 uppercase border-b border-neutral-200 dark:border-noir-border">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Activity Description</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-noir-border font-mono">
                {account?.history && account.history.length > 0 ? (
                  account.history.map((h, i) => (
                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-noir-subtle">
                      <td className="py-2.5 px-3 text-neutral-500 text-[11px]">
                        {new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-800 dark:text-neutral-200 font-sans">
                        {h.note || h.type}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        h.points > 0 ? 'text-emerald-600' : 'text-neutral-900 dark:text-white'
                      }`}>
                        {h.points > 0 ? `+${h.points}` : h.points}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-400 font-mono">
                      No point transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invited Friends Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-editorial text-2xl font-semibold text-neutral-900 dark:text-white">
            Referral Invitations
          </h3>

          <div className="border border-[#E5E5E0] dark:border-noir-border rounded overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-noir-subtle font-mono text-[11px] text-neutral-500 uppercase border-b border-neutral-200 dark:border-noir-border">
                <tr>
                  <th className="py-2.5 px-3">Collector</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-noir-border font-mono">
                {account?.referrals && account.referrals.length > 0 ? (
                  account.referrals.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-noir-subtle">
                      <td className="py-2.5 px-3 font-sans text-neutral-800 dark:text-neutral-200">
                        {r.referredUser?.name || 'Friend'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                          r.status === 'rewarded'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                        +{r.bonusAwarded || config?.referrerBonusPoints || 150}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-400 font-mono">
                      No friend referrals yet. Share your code above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-noir-subtle rounded border border-neutral-200 dark:border-noir-border text-[11px] text-neutral-500 space-y-1">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">Policy & Margin Safeguards:</p>
            <p>• Points are awarded strictly after orders are captured and verified.</p>
            <p>• Self-referrals and duplicate accounts are automatically flagged and rejected.</p>
            <p>• Maximum voucher discount is capped at 30% of order value.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
