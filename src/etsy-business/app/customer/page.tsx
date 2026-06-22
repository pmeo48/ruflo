'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User, Download, Star, Clock, CheckCircle, ShoppingBag,
  Mail, ArrowRight, RefreshCw, Package, ExternalLink, MessageSquare
} from 'lucide-react'

interface CustomerOrder {
  id: string
  productId: string
  productName: string
  productType: string
  amount: number
  status: string
  downloadUrl: string
  downloadExpiresAt: string
  customerEmail: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Guide',
  spreadsheet: 'Spreadsheet',
  notion: 'Notion Template',
  'prompt-pack': 'Prompt Pack',
  bundle: 'Bundle',
}

const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-blue-100 text-blue-700',
  spreadsheet: 'bg-green-100 text-green-700',
  notion: 'bg-purple-100 text-purple-700',
  'prompt-pack': 'bg-orange-100 text-orange-700',
  bundle: 'bg-indigo-100 text-indigo-700',
}

function daysUntil(date: string): number {
  return Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / 86400000))
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 30) return `${Math.floor(days / 30)}mo ago`
  if (days > 0) return `${days}d ago`
  return 'Today'
}

function ReviewModal({ order, onClose, onSubmit }: {
  order: CustomerOrder
  onClose: () => void
  onSubmit: (rating: number, title: string, body: string) => void
}) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [hovered, setHovered] = useState(0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Leave a Review</h2>
        <p className="text-sm text-gray-500 mb-5">{order.productName}</p>

        {/* Star picker */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  s <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500 self-center">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hovered || rating]}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Review Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your Review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell others about your experience with this product..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onSubmit(rating, title, body)}
            disabled={!body.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Submit Review
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, onReview, reviewed }: {
  order: CustomerOrder
  onReview: (order: CustomerOrder) => void
  reviewed: boolean
}) {
  const daysLeft = daysUntil(order.downloadExpiresAt)
  const isExpired = daysLeft === 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4 p-4">
        {/* Product icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-snug">{order.productName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[order.productType] ?? 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABELS[order.productType] ?? order.productType}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900 flex-shrink-0">${order.amount}</span>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-green-700 font-medium">Completed</span>
            {!isExpired && (
              <>
                <span className="text-gray-300">·</span>
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Download expires in {daysLeft}d</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={order.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isExpired
                  ? 'bg-gray-100 text-gray-400 pointer-events-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Download className="w-3 h-3" />
              {isExpired ? 'Link Expired' : 'Download'}
            </a>

            {!reviewed ? (
              <button
                onClick={() => onReview(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Star className="w-3 h-3" />
                Leave Review
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3 h-3" /> Review submitted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerPortalPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [error, setError] = useState('')
  const [reviewTarget, setReviewTarget] = useState<CustomerOrder | null>(null)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [reviewSuccess, setReviewSuccess] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
        setSubmitted(true)
      } else {
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Unable to look up orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewSubmit(rating: number, title: string, body: string) {
    if (!reviewTarget) return
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: reviewTarget.productId,
        productName: reviewTarget.productName,
        customerName: email.split('@')[0],
        customerEmail: email,
        rating,
        title,
        body,
      }),
    })
    setReviewed((prev) => { const next = new Set(prev); next.add(reviewTarget.id); return next })
    setReviewTarget(null)
    setReviewSuccess(true)
    setTimeout(() => setReviewSuccess(false), 4000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Customer Portal</h1>
          <p className="text-indigo-300 text-sm mt-1">Access your purchases and downloads</p>
        </div>

        {!submitted ? (
          /* Email lookup form */
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Find your orders</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter the email address you used at checkout to access your purchases.
            </p>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Looking up...</>
                ) : (
                  <>Find My Orders <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Don't see your orders?{' '}
                <Link href="/store" className="text-indigo-600 hover:underline font-medium">
                  Browse the store
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-gray-900">Your Orders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{email}</p>
                </div>
                <button
                  onClick={() => { setSubmitted(false); setOrders([]); setEmail('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Sign out
                </button>
              </div>

              {reviewSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 mb-4 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> Review submitted! Thank you.
                </div>
              )}

              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No orders found for this email.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onReview={setReviewTarget}
                      reviewed={reviewed.has(order.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Help box */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex gap-3">
              <MessageSquare className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200">
                <p className="font-medium text-white mb-0.5">Need help?</p>
                <p>Questions about your order? Browse the{' '}
                  <Link href="/store" className="text-indigo-300 hover:text-white underline">store</Link>
                  {' '}or contact support. All digital products come with a 30-day satisfaction guarantee.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/store" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Browse more products
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          order={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  )
}
