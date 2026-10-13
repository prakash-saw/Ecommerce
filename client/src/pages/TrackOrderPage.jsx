import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, AlertTriangle, Truck, Package, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';

const STAGES = [
  { key: 'pending_approval', label: 'Payment Verified & In Queue', desc: 'Pre-press artwork and resolution check' },
  { key: 'approved', label: 'Artwork Approved', desc: 'Ready for Direct-to-Garment printing' },
  { key: 'in_production', label: 'Printing on 240 GSM Blank', desc: 'Pigment DTG printing and heat curing' },
  { key: 'quality_checked', label: 'Quality Inspected', desc: 'Wash-fastness, alignment & sizing verified' },
  { key: 'packed', label: 'Packed in Atelier Polymailers', desc: 'Prepared with care label insert' },
  { key: 'shipped', label: 'Dispatched via Air Courier', desc: 'Handed to BlueDart / Delhivery cargo' },
];

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (numberToTrack) => {
    if (!numberToTrack?.trim()) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest(`/orders/track/${encodeURIComponent(numberToTrack.trim())}`);
      if (res.success) {
        setTrackingData(res.trackingInfo);
      }
    } catch (err) {
      setError(err.message || 'No order found with this tracking code');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const param = searchParams.get('order');
    if (param) {
      setOrderNumber(param);
      fetchTracking(param);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(orderNumber);
  };

  const getStageIndex = (status) => {
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIdx = trackingData ? getStageIndex(trackingData.fulfilmentStatus) : 0;
  const isRejected = trackingData?.fulfilmentStatus === 'artwork_rejected';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-20 space-y-10">
      <div className="text-center space-y-3 pb-6 border-b border-[#E5E5E0]">
        <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">Live Production Status</span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900">
          Track Your Atelier Order
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
          Enter your unique order number to check real-time pre-press file review, garment printing, and courier dispatch.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="e.g. BLC-82194-4321"
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded font-mono text-xs uppercase focus:border-black focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-black text-white uppercase text-xs tracking-widest font-semibold hover:bg-neutral-800 transition-colors rounded"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tracking Results View */}
      {trackingData && (
        <div className="bg-white border border-[#E5E5E0] p-6 sm:p-8 rounded-sm space-y-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-neutral-100 gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">Order Number</span>
              <h2 className="font-mono text-xl font-bold text-neutral-900">{trackingData.orderNumber}</h2>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">Payment State</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                {trackingData.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Rejection Alert if applicable */}
          {isRejected && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded text-xs space-y-1">
              <strong className="text-amber-900 font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Artwork Requires Revision
              </strong>
              <p className="text-amber-800">
                Reason from atelier pre-press: <em>"{trackingData.rejectionReason}"</em>
              </p>
              <p className="text-neutral-600 text-[11px] pt-1">
                Please contact our atelier desk at <strong>desk@blancatelier.com</strong> with updated high-resolution artwork.
              </p>
            </div>
          )}

          {/* Stepper Flow */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-900">
              Fulfilment Timeline
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentIdx && !isRejected;
                const isCurrent = idx === currentIdx && !isRejected;

                return (
                  <div key={stage.key} className="relative space-y-1">
                    {/* Circle icon marker */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isPassed
                          ? 'bg-black text-white'
                          : 'bg-white border-2 border-neutral-300 text-transparent'
                      }`}
                    >
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <h4 className={`text-xs font-semibold ${isCurrent ? 'text-black font-bold' : isPassed ? 'text-neutral-800' : 'text-neutral-400'}`}>
                      {stage.label}
                    </h4>
                    <p className="text-[11px] text-neutral-500">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carrier Tracking Link if Shipped */}
          {trackingData.tracking?.trackingNumber && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Carrier & AWB</span>
                <span className="font-mono font-bold text-black">
                  {trackingData.tracking.carrier}: {trackingData.tracking.trackingNumber}
                </span>
              </div>
              {trackingData.tracking.trackingUrl && (
                <a
                  href={trackingData.tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black text-white rounded text-[11px] uppercase tracking-wider font-semibold"
                >
                  Live Courier Tracking
                </a>
              )}
            </div>
          )}

          {/* Items Summary */}
          <div className="pt-6 border-t border-neutral-100 space-y-3">
            <span className="text-[11px] uppercase tracking-widest font-bold text-neutral-900 block">
              Package Contents
            </span>
            <div className="space-y-3">
              {trackingData.itemsSummary?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className="w-12 h-14 bg-neutral-100 rounded border border-neutral-200 overflow-hidden flex-shrink-0">
                    <img src={item.previewImageUrl} alt={item.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black">{item.name}</h5>
                    <span className="text-neutral-500 text-[11px]">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      {item.isCustom && ' • Custom Print'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
