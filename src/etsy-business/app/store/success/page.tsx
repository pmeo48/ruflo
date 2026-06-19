'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, LayoutDashboard, Download, Mail, Clock } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Order } from '@/lib/orders'

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const productName = params.get('product')
  const isDemo = sessionId?.startsWith('demo_')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/orders')
        const data = await res.json()
        if (data.orders?.length > 0) setOrder(data.orders[0])
      } catch { /* silent */ }
    }, 1500)
    return () => clearTimeout(timer)
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 text-2xl">🎉</div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">Purchase Complete!</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Thank you! Your digital product is on its way.</p>

        {(productName || order?.productName) && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-center">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">Your Purchase</p>
            <p className="font-bold text-indigo-900 text-sm">{order?.productName ?? decodeURIComponent(productName ?? '')}</p>
            {order?.amount && <p className="text-indigo-600 text-xs mt-0.5">${order.amount.toFixed(2)} paid</p>}
          </div>
        )}

        {order?.downloadUrl && order.status === 'completed' ? (
          <a
            href={order.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors mb-4"
          >
            <Download className="w-4 h-4" />
            Download Your Product Now
          </a>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 flex gap-3">
            <Mail className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Check your email</p>
              <p className="text-xs text-amber-600 mt-0.5">Your download link has been emailed to you. Links expire after 30 days.</p>
            </div>
          </div>
        )}

        {sessionId && !isDemo && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <Clock className="w-3 h-3" />
            <span className="font-mono truncate">Order: {sessionId.slice(0, 24)}...</span>
          </div>
        )}

        {isDemo && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-5">
            Demo mode — no real charge. Add <code className="font-mono">STRIPE_SECRET_KEY</code> to enable live payments.
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">What happens next</p>
          <ul className="space-y-2 text-xs text-gray-600">
            {[
              'Download link emailed within minutes',
              'Access your product immediately via the link',
              'Download link valid for 30 days',
              '30-day satisfaction guarantee',
            ].map((step) => (
              <li key={step} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/store"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse More
          </Link>
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
