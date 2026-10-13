import React, { useState, useEffect } from 'react';
import {
  Star, CheckCircle2, ShieldCheck, Flag, Trash2, Edit3,
  ThumbsUp, Filter, MessageSquare, Image as ImageIcon, X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ReviewsSection({ productId, productName }) {
  const { user } = useAuth();
  const [reviewsData, setReviewsData] = useState({
    averageRating: 0,
    totalReviews: 0,
    verifiedCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews: [],
    userReviewStatus: { canReview: false, existingReviewId: null, isVerified: false }
  });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Review Modal Form State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formPhotos, setFormPhotos] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Report Modal
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRatingFilter) params.append('rating', selectedRatingFilter);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (sortBy) params.append('sortBy', sortBy);

      const res = await apiRequest(`/reviews/product/${productId}?${params.toString()}`);
      if (res.success) {
        setReviewsData(res);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId, selectedRatingFilter, verifiedOnly, sortBy, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formTitle.trim() || !formComment.trim()) {
      setFormError('Please enter both a title and written feedback.');
      return;
    }

    try {
      setSubmitting(true);
      const photoArray = formPhotos
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.startsWith('http://') || url.startsWith('https://'));

      const payload = {
        productId,
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        photos: photoArray
      };

      let res;
      if (editingReviewId) {
        res = await apiRequest(`/reviews/${editingReviewId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiRequest('/reviews', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.success) {
        setShowReviewModal(false);
        setEditingReviewId(null);
        setFormTitle('');
        setFormComment('');
        setFormPhotos('');
        fetchReviews();
      }
    } catch (err) {
      setFormError(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.success) {
        fetchReviews();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (review) => {
    setEditingReviewId(review._id);
    setFormRating(review.rating);
    setFormTitle(review.title);
    setFormComment(review.comment);
    setFormPhotos(review.photos ? review.photos.join('\n') : '');
    setShowReviewModal(true);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      setReportLoading(true);
      const res = await apiRequest(`/reviews/${reportingReviewId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason.trim() })
      });
      if (res.success) {
        alert(res.message);
        setReportingReviewId(null);
        setReportReason('');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const { averageRating, totalReviews, verifiedCount, distribution, reviews, userReviewStatus } = reviewsData;

  return (
    <section className="border-t border-[#E5E5E0] dark:border-noir-border pt-12 space-y-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-100 dark:border-noir-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-500 uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Customer Feedback</span>
          </div>
          <h2 className="font-editorial text-3xl font-semibold text-neutral-900 dark:text-white">
            Ratings & Reviews
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real fit impressions, cotton weight assessments, and durability feedback from customers.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {user ? (
            <button
              onClick={() => {
                setEditingReviewId(null);
                setFormRating(5);
                setFormTitle('');
                setFormComment('');
                setFormPhotos('');
                setShowReviewModal(true);
              }}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 transition-opacity rounded flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{userReviewStatus.existingReviewId ? 'Edit Your Review' : 'Write a Review'}</span>
            </button>
          ) : (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Please sign in to share your review.
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Score & Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-noir-card p-6 rounded border border-[#E5E5E0] dark:border-noir-cardBorder">
        {/* Score Card (4 cols) */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 md:border-r border-neutral-100 dark:border-noir-border md:pr-6">
          <div className="flex items-baseline justify-center md:justify-start gap-3">
            <span className="font-editorial text-5xl font-bold text-neutral-900 dark:text-white">
              {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <span className="text-xs font-mono text-neutral-400 uppercase">/ 5.0 Rating</span>
          </div>

          <div className="flex justify-center md:justify-start gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating || 5)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-300 dark:text-neutral-600'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} ({verifiedCount} verified)
          </p>
        </div>

        {/* Rating Breakdown Bars (8 cols) */}
        <div className="md:col-span-8 space-y-1.5 font-mono text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-12 text-neutral-600 dark:text-neutral-400 text-right">
                  {stars} ★
                </span>
                <div className="flex-1 h-2 bg-neutral-100 dark:bg-noir-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-neutral-400 text-[11px]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
            Filter:
          </span>
          <button
            onClick={() => setSelectedRatingFilter('')}
            className={`px-3 py-1 rounded border transition-colors ${
              selectedRatingFilter === ''
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-medium'
                : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRatingFilter(String(r))}
              className={`px-2.5 py-1 rounded border transition-colors ${
                selectedRatingFilter === String(r)
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-medium'
                  : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {r} ★
            </button>
          ))}

          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              verifiedOnly
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Purchase Only</span>
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 font-mono text-[11px] uppercase">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1 border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-800 dark:text-neutral-200 text-xs font-mono"
          >
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono animate-pulse">
            Loading verified reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600" />
            <p className="font-editorial text-lg text-neutral-800 dark:text-neutral-200">
              No customer reviews found for this selection.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Be the first to review this garment after experiencing its fit and heavyweight cotton drape.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const isAuthor = user && (user.id === r.userId || user._id === r.userId);
            return (
              <div
                key={r._id}
                className="p-5 bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                        {r.customerName}
                      </span>
                      {r.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-amber-500">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete / Report) */}
                  <div className="flex items-center gap-2 text-neutral-400">
                    {isAuthor ? (
                      <>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="hover:text-black dark:hover:text-white p-1"
                          title="Edit your review"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(r._id)}
                          className="hover:text-red-600 p-1"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setReportingReviewId(r._id);
                          setReportReason('');
                        }}
                        className="hover:text-neutral-700 dark:hover:text-neutral-200 text-[10px] flex items-center gap-1 font-mono uppercase"
                        title="Report inappropriate content"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Body */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
                    {r.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                    {r.comment}
                  </p>
                </div>

                {/* Attached Customer Photos */}
                {r.photos && r.photos.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto">
                    {r.photos.map((imgUrl, i) => (
                      <a
                        key={i}
                        href={imgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded border border-neutral-200 dark:border-noir-border overflow-hidden flex-shrink-0 group"
                      >
                        <img
                          src={imgUrl}
                          alt="Customer review photo"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded-sm shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-noir-border">
              <h3 className="font-editorial text-xl font-semibold text-neutral-900 dark:text-white">
                {editingReviewId ? 'Edit Your Review' : 'Review Garment'}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 text-xs rounded border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block font-mono uppercase tracking-wider">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex gap-2 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block font-mono uppercase tracking-wider">
                  Review Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Perfect heavyweight cotton drape"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-sans"
                  required
                />
              </div>

              {/* Review Comment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block font-mono uppercase tracking-wider">
                  Written Feedback *
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details on how the t-shirt fits your build, collar retention after washing, and fabric comfort..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  maxLength={2000}
                  className="w-full px-3 py-2 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-sans"
                  required
                />
              </div>

              {/* Optional Photo URLs */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-900 dark:text-white block font-mono uppercase tracking-wider">
                  Customer Photo URLs (Optional, one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="https://example.com/my-tshirt-fit.jpg"
                  value={formPhotos}
                  onChange={(e) => setFormPhotos(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border rounded text-xs uppercase font-mono tracking-wider text-neutral-600 dark:text-neutral-400 hover:border-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold rounded hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-noir-card border border-[#E5E5E0] dark:border-noir-cardBorder rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-noir-border">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                Report Inappropriate Review
              </h4>
              <button
                onClick={() => setReportingReviewId(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Please tell us why you are reporting this review (e.g. spam, vulgarity, competitor advertising):
            </p>
            <form onSubmit={handleReport} className="space-y-3">
              <textarea
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe reason for reporting..."
                required
                className="w-full p-2.5 text-xs border rounded bg-transparent border-neutral-300 dark:border-noir-border text-neutral-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingReviewId(null)}
                  className="px-3 py-1.5 text-xs border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700"
                >
                  {reportLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
