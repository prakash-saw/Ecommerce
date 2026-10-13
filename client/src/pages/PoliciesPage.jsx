import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Truck, RotateCcw, Sparkles } from 'lucide-react';

export default function PoliciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pod';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20 space-y-10">
      <div className="space-y-3 pb-6 border-b border-[#E5E5E0]">
        <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">Legal & Policies</span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-neutral-900">
          Atelier Policies & Consumer Trust
        </h1>
      </div>

      {/* Policy Tabs */}
      <div className="flex border-b border-neutral-200 gap-6 text-xs uppercase tracking-widest font-semibold">
        <button
          onClick={() => setSearchParams({ tab: 'pod' })}
          className={`pb-3 transition-colors ${
            currentTab === 'pod' ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          Print-on-Demand Policy
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'shipping' })}
          className={`pb-3 transition-colors ${
            currentTab === 'shipping' ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          Shipping & Timelines
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'returns' })}
          className={`pb-3 transition-colors ${
            currentTab === 'returns' ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          Returns & Refunds
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'care' })}
          className={`pb-3 transition-colors ${
            currentTab === 'care' ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          Garment Care
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'contact' })}
          className={`pb-3 transition-colors ${
            currentTab === 'contact' ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          Support Concierge
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-neutral-200 p-8 rounded-sm space-y-6 text-xs text-neutral-700 leading-relaxed">
        {currentTab === 'pod' && (
          <div className="space-y-4">
            <h3 className="font-editorial text-2xl font-bold text-neutral-900">Print-on-Demand Approval & Quality Guidelines</h3>
            <p>
              When an order containing custom designs is placed, our Bangalore pre-press team reviews the uploaded artwork. If resolution falls below 150 DPI or contains clipping boundaries, we notify you to review files before ink is applied.
            </p>
            <h4 className="font-bold text-black uppercase tracking-wider text-[11px] pt-2">Cancellations Before Printing</h4>
            <p>
              Custom orders can be cancelled with a 100% full refund at any time while in the <strong>"Pending Approval"</strong> state before physical Direct-to-Garment printing commences.
            </p>
            <h4 className="font-bold text-black uppercase tracking-wider text-[11px] pt-2">Color Calibration Disclaimer</h4>
            <p>
              Digital computer screens display images in illuminated RGB color space, whereas physical fabric printers operate with CMYK and water-based textile pigments. Subtle variations in hue and saturation are standard across physical textile production.
            </p>
          </div>
        )}

        {currentTab === 'shipping' && (
          <div className="space-y-4">
            <h3 className="font-editorial text-2xl font-bold text-neutral-900">Pan-India Express Shipping & Fulfillment</h3>
            <p>
              All orders are dispatched from our Indiranagar, Bengaluru studio via air express cargo (BlueDart, Delhivery, or Xpressbees).
            </p>
            <ul className="list-disc list-inside space-y-2 pt-2">
              <li><strong>Ready-to-Wear T-Shirts:</strong> Dispatched within 24–48 business hours. Delivered in 2–4 days.</li>
              <li><strong>Custom POD T-Shirts:</strong> 2 business days for pre-press, DTG printing & heat curing. Dispatched within 3–5 business days.</li>
              <li><strong>Complimentary Delivery:</strong> Orders exceeding ₹1,499 receive free shipping automatically at checkout. Flat ₹99 for orders under ₹1,499.</li>
            </ul>
          </div>
        )}

        {currentTab === 'returns' && (
          <div className="space-y-4">
            <h3 className="font-editorial text-2xl font-bold text-neutral-900">Returns, Defective Goods & Consumer Protection</h3>
            <p>
              In accordance with Indian Consumer Protection guidelines, we stand by our quality:
            </p>
            <ul className="list-disc list-inside space-y-2 pt-2">
              <li><strong>Manufacturing Defects & Print Flaws:</strong> If your garment arrives with fabric tears, seam defects, misalignment, or print smudging, report within 7 days with photos for an immediate free reprint or 100% refund.</li>
              <li><strong>Ready-to-Wear Returns:</strong> Unworn, unwashed ready-made garments with original tags can be returned or exchanged for size within 7 days of delivery.</li>
              <li><strong>Custom POD Personalized Products:</strong> Because customized garments are created exclusively to your specification, returns for subjective change-of-mind are not accepted once physically printed. Sizing charts are provided on every product page to ensure accurate fit.</li>
            </ul>
          </div>
        )}

        {currentTab === 'care' && (
          <div className="space-y-4">
            <h3 className="font-editorial text-2xl font-bold text-neutral-900">240 GSM Heavyweight Cotton Care Protocol</h3>
            <p>
              To maintain the tactile softness and dense structure of your combed cotton tee:
            </p>
            <ul className="list-disc list-inside space-y-2 pt-2">
              <li>Always wash inside out in cold water (maximum 30°C).</li>
              <li>Use mild liquid detergent. Avoid harsh chlorine bleaches or industrial whiteners.</li>
              <li>Never iron directly onto printed graphics or artwork. Iron on the reverse side on medium heat.</li>
              <li>Line dry in the shade to prevent ultraviolet fading. Do not tumble dry on high heat.</li>
            </ul>
          </div>
        )}

        {currentTab === 'contact' && (
          <SupportInquiryForm />
        )}
      </div>
    </div>
  );
}

function SupportInquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [category, setCategory] = useState('sizing');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          orderNumber,
          category,
          subject,
          message
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketResult(data.ticketNumber);
      } else {
        setError(data.message || 'Failed to submit inquiry');
      }
    } catch (err) {
      setError(err.message || 'Error submitting inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketResult) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-bold text-base">
          ✓
        </div>
        <h3 className="font-editorial text-2xl font-bold text-neutral-900">Enquiry Submitted</h3>
        <p className="text-xs text-neutral-600">
          Your support reference number is <strong className="font-mono text-black">{ticketResult}</strong>.
        </p>
        <p className="text-xs text-neutral-500">
          Our atelier concierge in Bengaluru will inspect your request and respond via email within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-editorial text-2xl font-bold text-neutral-900">Contact Atelier Concierge</h3>
        <p className="text-xs text-neutral-500">
          Have a question about fabric drape, sizing measurements, POD artwork, or shipping status? Submit a request directly to our team.
        </p>
      </div>

      {error && <p className="text-rose-600 text-xs">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3 py-2 rounded border border-neutral-300"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aarav@college.in"
              className="w-full px-3 py-2 rounded border border-neutral-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded border border-neutral-300"
            >
              <option value="sizing">Sizing & Garment Fit</option>
              <option value="pod_customization">POD Custom Studio Artwork</option>
              <option value="shipping">Shipping & Tracking</option>
              <option value="returns">Exchange & Returns</option>
              <option value="payment">Payment & Billing</option>
              <option value="general">General Inquiries</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Mobile (Optional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 rounded border border-neutral-300"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Order # (Optional)</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. BLC-84723"
              className="w-full px-3 py-2 rounded border border-neutral-300 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Subject *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your question"
            className="w-full px-3 py-2 rounded border border-neutral-300"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Detailed Message *</label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please detail your question or measurements..."
            className="w-full px-3 py-2 rounded border border-neutral-300"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-black text-white font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-50 text-xs"
        >
          {submitting ? 'Submitting...' : 'Send to Atelier Concierge'}
        </button>
      </form>
    </div>
  );
}
