import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  ShieldCheck,
  Eye,
  EyeOff,
  Flag,
  CheckCircle,
  AlertTriangle,
  Send,
  User,
  Clock,
  Phone,
  HelpCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { createWhatsAppUrl, getWhatsAppNumber } from '../../utils/whatsapp';

export default function AdminReviewsSupportTab() {
  const [subSection, setSubSection] = useState('tickets'); // 'tickets' | 'reviews'

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [newTicketStatus, setNewTicketStatus] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const url = ticketStatusFilter ? `/admin/support/tickets?status=${ticketStatusFilter}` : '/admin/support/tickets';
      const res = await apiRequest(url);
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const url = reviewStatusFilter ? `/admin/reviews?status=${reviewStatusFilter}` : '/admin/reviews';
      const res = await apiRequest(url);
      if (res.success) {
        setReviews(res.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (subSection === 'tickets') fetchTickets();
    else fetchReviews();
  }, [subSection, ticketStatusFilter, reviewStatusFilter]);

  const handleModerateReview = async (reviewId, status) => {
    const reason = window.prompt(`Enter moderation reason for setting review to "${status}":`, '');
    if (reason === null) return;

    try {
      const res = await apiRequest(`/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason })
      });
      if (res.success) {
        fetchReviews();
      }
    } catch (err) {
      alert('Moderation error: ' + err.message);
    }
  };

  const openTicketDrawer = (t) => {
    setSelectedTicket(t);
    setNewTicketStatus(t.status || 'open');
    setInternalNoteText('');
    setTicketDrawerOpen(true);
  };

  const handleUpdateTicketStatus = async () => {
    if (!selectedTicket) return;
    try {
      const res = await apiRequest(`/admin/support/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newTicketStatus })
      });
      if (res.success) {
        setSelectedTicket(res.ticket);
        fetchTickets();
      }
    } catch (err) {
      alert('Error updating ticket status: ' + err.message);
    }
  };

  const handleAddTicketNote = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !internalNoteText.trim()) return;
    try {
      setAddingNote(true);
      const res = await apiRequest(`/admin/support/tickets/${selectedTicket._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: internalNoteText })
      });
      if (res.success) {
        setSelectedTicket({ ...selectedTicket, internalNotes: res.internalNotes });
        setInternalNoteText('');
      }
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation pill */}
      <div className="flex items-center justify-between bg-[#FDFCFA] dark:bg-[#151515] p-4 rounded-2xl border border-[#EAEAE6] dark:border-[#222222]">
        <div className="flex items-center gap-2 bg-[#F2F2EE] dark:bg-[#202020] p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setSubSection('tickets')}
            className={`px-4 py-1.5 rounded-lg transition ${
              subSection === 'tickets'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Customer Enquiries Inbox
          </button>
          <button
            onClick={() => setSubSection('reviews')}
            className={`px-4 py-1.5 rounded-lg transition ${
              subSection === 'reviews'
                ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Review Moderation Queue
          </button>
        </div>

        {/* WhatsApp Concierge Quick Launch */}
        <a
          href={createWhatsAppUrl("Hello BLANC ATELIER Support Desk. I am assisting an active customer inquiry.")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Launch WhatsApp Desk</span>
        </a>
      </div>

      {/* 1. SUPPORT TICKETS SECTION */}
      {subSection === 'tickets' && (
        <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
          <div className="p-4 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-black text-[#111111] dark:text-white uppercase tracking-wider">
                Support Enquiries
              </h3>
              <p className="text-xs text-neutral-400">Direct inquiries submitted by shoppers regarding fit, shipping, or POD studio.</p>
            </div>

            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-medium"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting for Customer</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {ticketsLoading ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">Loading support inbox...</div>
          ) : tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                  <tr>
                    <th className="py-3 px-4">Ticket #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Subject / Message</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                  {tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#111111] dark:text-white">
                        {t.ticketNumber}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#111111] dark:text-white">{t.customerName}</p>
                        <p className="text-[10px] font-mono text-neutral-400">{t.customerEmail}</p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {t.category?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-semibold text-[#111111] dark:text-white truncate">{t.subject}</p>
                        <p className="text-neutral-400 text-[11px] truncate">{t.message}</p>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            t.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openTicketDrawer(t)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">
              No customer inquiries found. Inbox is clear.
            </div>
          )}
        </div>
      )}

      {/* 2. REVIEW MODERATION SECTION */}
      {subSection === 'reviews' && (
        <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
          <div className="p-4 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-black text-[#111111] dark:text-white uppercase tracking-wider">
                Review Moderation Ledger
              </h3>
              <p className="text-xs text-neutral-400">Protect product trust by moderating verified customer reviews with logged audit reasons.</p>
            </div>

            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-medium"
            >
              <option value="">All Review Statuses</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {reviewsLoading ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">Loading customer reviews...</div>
          ) : reviews.length > 0 ? (
            <div className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
              {reviews.map((r) => (
                <div key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-[#111111] dark:text-white text-xs">{r.title || 'Review'}</span>
                      {r.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-semibold">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED ORDER
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-700 dark:text-neutral-300">{r.comment}</p>

                    <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-2">
                      <span>By: {r.userId?.name || 'Anonymous Customer'}</span>
                      <span>•</span>
                      <span>Product: {r.productId?.name || 'T-Shirt'}</span>
                      <span>•</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                      {r.moderationReason && (
                        <span className="text-rose-500">Reason: {r.moderationReason}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        r.moderationStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.moderationStatus === 'flagged'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.moderationStatus}
                    </span>

                    {r.moderationStatus !== 'approved' && (
                      <button
                        onClick={() => handleModerateReview(r._id, 'approved')}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono text-[10px] hover:bg-emerald-700 transition"
                      >
                        Approve
                      </button>
                    )}
                    {r.moderationStatus !== 'hidden' && (
                      <button
                        onClick={() => handleModerateReview(r._id, 'hidden')}
                        className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-[10px] hover:bg-rose-700 transition"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-400">
              No customer reviews found matching criteria.
            </div>
          )}
        </div>
      )}

      {/* Ticket Details & Notes Drawer */}
      {ticketDrawerOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[#FDFCFA] dark:bg-[#151515] h-full shadow-2xl flex flex-col border-l border-[#EAEAE6] dark:border-[#222222]">
            <div className="p-5 border-b border-[#EAEAE6] dark:border-[#222222] flex items-center justify-between">
              <div>
                <h3 className="font-mono font-bold text-base text-[#111111] dark:text-white">
                  Ticket #{selectedTicket.ticketNumber}
                </h3>
                <p className="text-xs text-neutral-400">Customer Support Consultation</p>
              </div>
              <button onClick={() => setTicketDrawerOpen(false)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828] space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-neutral-400">
                  <span>Customer: <strong className="text-[#111111] dark:text-white">{selectedTicket.customerName}</strong></span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-neutral-500 font-mono">{selectedTicket.customerEmail}</p>
                {selectedTicket.orderNumber && (
                  <p className="text-neutral-500 font-mono">Related Order: #{selectedTicket.orderNumber}</p>
                )}
                <div className="pt-2 border-t border-[#EAEAE6] dark:border-[#282828]">
                  <p className="font-bold text-[#111111] dark:text-white mb-1">{selectedTicket.subject}</p>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed bg-white dark:bg-neutral-800 p-3 rounded-lg border border-[#EAEAE6] dark:border-[#282828]">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-3 bg-white dark:bg-[#181818] p-3 rounded-xl border border-[#EAEAE6] dark:border-[#282828]">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Ticket Lifecycle:</span>
                <select
                  value={newTicketStatus}
                  onChange={(e) => setNewTicketStatus(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-xs font-mono"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateTicketStatus}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-lg"
                >
                  Save
                </button>
              </div>

              {/* Internal Notes Feed */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-neutral-500">Internal Concierge Notes</h4>

                <form onSubmit={handleAddTicketNote} className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="Add private staff resolution notes..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !internalNoteText.trim()}
                    className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg disabled:opacity-40"
                  >
                    Post Note
                  </button>
                </form>

                <div className="space-y-2">
                  {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 ? (
                    selectedTicket.internalNotes.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C1C1C] border border-[#EAEAE6] dark:border-[#282828]">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-0.5">
                          <span>{n.authorEmail}</span>
                          <span>{new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-300">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 font-mono text-[11px]">No internal notes recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
