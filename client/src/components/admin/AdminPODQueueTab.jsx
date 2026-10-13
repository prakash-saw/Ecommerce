import React, { useState, useEffect } from 'react';
import {
  Printer,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Download,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ExternalLink,
  X
} from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function AdminPODQueueTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Review Modals
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchPODQueue = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/pod-queue?status=${statusFilter}` : '/admin/pod-queue';
      const res = await apiRequest(url);
      if (res.success) {
        setJobs(res.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching POD queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODQueue();
  }, [statusFilter]);

  const handleApprove = async (jobId) => {
    try {
      setApproving(true);
      const res = await apiRequest(`/admin/pod-queue/${jobId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: reviewNotes || 'High-res artwork approved for DTG queue' })
      });
      if (res.success) {
        setSelectedJob(null);
        setReviewNotes('');
        fetchPODQueue();
        alert('Job approved and scheduled for printing!');
      }
    } catch (err) {
      alert('Approval error: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (jobId) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason (e.g. low resolution image).');
      return;
    }
    try {
      setRejecting(true);
      const res = await apiRequest(`/admin/pod-queue/${jobId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.success) {
        setSelectedJob(null);
        setRejectionReason('');
        fetchPODQueue();
        alert('Job rejected and flagged for customer re-upload.');
      }
    } catch (err) {
      alert('Rejection error: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] p-5 rounded-2xl border border-[#EAEAE6] dark:border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-neutral-400" /> DTG Production & Pre-Press Queue
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Inspect customer graphic DPI, print canvas positions, and route to Brother GTX / Kornit digital textile printers.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-medium self-start sm:self-auto"
        >
          <option value="">All Pre-Press States</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="in_production">In Production</option>
          <option value="printed">Printed</option>
          <option value="rejected">Artwork Rejected</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-[#FDFCFA] dark:bg-[#151515] rounded-2xl border border-[#EAEAE6] dark:border-[#222222] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">Loading print queue...</div>
        ) : jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#1C1C1C] text-neutral-500 font-mono uppercase text-[10px] border-b border-[#EAEAE6] dark:border-[#222222]">
                <tr>
                  <th className="py-3 px-4">Job Number</th>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Garment Silhouette</th>
                  <th className="py-3 px-3">Print Locations</th>
                  <th className="py-3 px-3">Artwork DPI</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Pre-Press Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222222]">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#111111] dark:text-white">
                      {job.jobId}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold">
                      #{job.orderNumber}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#111111] dark:text-white">{job.productName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono block">Size: {job.selectedSize}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {job.printLocations?.map(loc => (
                          <span key={loc} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 uppercase">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (job.prepressChecklist?.dpiEstimated || 300) >= 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {job.prepressChecklist?.dpiEstimated || 300} DPI
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {job.productionStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-3 py-1 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700 font-mono text-[11px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                      >
                        Inspect Manifest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs font-mono text-neutral-400">
            No DTG jobs currently in the pre-press review queue.
          </div>
        )}
      </div>

      {/* Pre-Press Inspector Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCFA] dark:bg-[#151515] w-full max-w-2xl rounded-2xl border border-[#EAEAE6] dark:border-[#222222] shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAEAE6] dark:border-[#222222] pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-[#111111] dark:text-white">
                  Pre-Press Inspection: {selectedJob.jobId}
                </h3>
                <p className="text-neutral-400">Order #{selectedJob.orderNumber} • Size {selectedJob.selectedSize}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-neutral-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Artwork Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-3 rounded-xl border border-[#EAEAE6] dark:border-[#282828] text-center">
                <p className="font-mono uppercase text-[10px] text-neutral-400 mb-2">Front Print Artwork</p>
                {selectedJob.productionSpecs?.frontArtworkUrl ? (
                  <img
                    src={selectedJob.productionSpecs.frontArtworkUrl}
                    alt="Front Artwork"
                    className="max-h-48 mx-auto object-contain rounded-lg bg-neutral-200 dark:bg-neutral-800"
                  />
                ) : (
                  <p className="text-neutral-400 py-8 font-mono">No front print file</p>
                )}
              </div>

              <div className="bg-[#FAF8F5] dark:bg-[#1C1C1C] p-3 rounded-xl border border-[#EAEAE6] dark:border-[#282828] text-center">
                <p className="font-mono uppercase text-[10px] text-neutral-400 mb-2">Back Print Artwork</p>
                {selectedJob.productionSpecs?.backArtworkUrl ? (
                  <img
                    src={selectedJob.productionSpecs.backArtworkUrl}
                    alt="Back Artwork"
                    className="max-h-48 mx-auto object-contain rounded-lg bg-neutral-200 dark:bg-neutral-800"
                  />
                ) : (
                  <p className="text-neutral-400 py-8 font-mono">No back print file</p>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white dark:bg-[#181818] p-4 rounded-xl border border-[#EAEAE6] dark:border-[#282828] space-y-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Technical Checks</h4>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>• Format: PNG Transparent 300DPI</div>
                <div>• Print Dimensions: 12" x 16" Max</div>
                <div>• Color Mode: sRGB Digital Profile</div>
                <div>• Garment Pre-treat: Organic Cotton Primer</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold mb-1">Pre-Press Review Notes</label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Sharp vectors verified, ready for Brother GTX"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E0E0DC] dark:border-neutral-700"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EAEAE6] dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => handleReject(selectedJob._id)}
                  disabled={rejecting}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Reject Design File'}
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedJob._id)}
                  disabled={approving}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve & Send to Print'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
