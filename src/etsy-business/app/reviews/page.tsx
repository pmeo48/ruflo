'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, CheckCircle, XCircle, Clock, ThumbsUp, Send } from 'lucide-react'
import { Review } from '@/lib/types'

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

const STATUS_CONFIG = {
  published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Review['status'] | 'all'>('all')
  const [replyTarget, setReplyTarget] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => { fetchReviews() }, [filter])

  async function fetchReviews() {
    setLoading(true)
    const params = filter !== 'all' ? `?status=${filter}` : ''
    const res = await fetch(`/api/reviews${params}`)
    const data = await res.json()
    setReviews(data.reviews || [])
    setLoading(false)
  }

  async function handleStatus(id: string, status: Review['status']) {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'status', id, status }),
    })
    fetchReviews()
  }

  async function handleReply(id: string) {
    if (!replyText.trim()) return
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'reply', id, reply: replyText }),
    })
    setReplyTarget(null)
    setReplyText('')
    fetchReviews()
  }

  const avgRating = reviews.filter((r) => r.status === 'published').length
    ? reviews.filter((r) => r.status === 'published').reduce((s, r) => s + r.rating, 0) /
      reviews.filter((r) => r.status === 'published').length
    : 0

  const pending = reviews.filter((r) => r.status === 'pending').length
  const published = reviews.filter((r) => r.status === 'published').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Star className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Testimonials</h1>
          <p className="text-gray-500 text-sm">Manage customer reviews and build social proof</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="flex justify-center mb-1">
            <StarRating rating={Math.round(avgRating)} size="md" />
          </div>
          <p className="text-xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
          <p className="text-xs text-gray-500">Total Reviews</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{published}</p>
          <p className="text-xs text-gray-500">Published</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-500">Awaiting Review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'published', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reviews found.</div>
        ) : reviews.map((review) => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {review.customerName[0]}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{review.customerName}</span>
                    {review.verified && (
                      <span className="ml-2 text-xs text-green-600 flex-shrink-0 inline-flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} />
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_CONFIG[review.status].color}`}>
                    {STATUS_CONFIG[review.status].icon}
                    {STATUS_CONFIG[review.status].label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{review.productName} · {new Date(review.createdAt).toLocaleDateString()}</p>
                {review.title && <p className="font-medium text-gray-800 text-sm">{review.title}</p>}
                <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>
              </div>
            </div>

            {/* Reply */}
            {review.reply && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 ml-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">Your Reply</p>
                <p className="text-sm text-blue-800">{review.reply}</p>
              </div>
            )}

            {/* Reply Form */}
            {replyTarget === review.id && (
              <div className="mt-2 ml-4 flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply to this review..."
                  rows={2}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleReply(review.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                  <button
                    onClick={() => { setReplyTarget(null); setReplyText('') }}
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {review.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatus(review.id, 'published')}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatus(review.id, 'rejected')}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
              {review.status === 'published' && !review.reply && (
                <button
                  onClick={() => setReplyTarget(review.id)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Reply
                </button>
              )}
              {review.status === 'published' && (
                <button
                  onClick={() => handleStatus(review.id, 'rejected')}
                  className="px-3 py-1.5 border border-gray-300 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50"
                >
                  Unpublish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
