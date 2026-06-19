'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, LayoutDashboard } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const productName = params.get('product')
  const isDemo = sessionId?.startsWith('demo_')

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-5">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">Thank you for your purchase!</h1>
        <p className="text-3xl mb-4">🎉</p>

        {productName && (
          <p className="text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg px-4 py-2 mb-4">
            {decodeURIComponent(productName)}
          </p>
        )}

        <p className="text-gray-500 text-sm mb-2">
          Your download will be ready within 24 hours. Check your email for delivery details.
        </p>

        {isDemo && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 mb-4">
            Demo mode — no real charge was made. Add <code className="font-mono">STRIPE_SECRET_KEY</code> to enable live payments.
          </p>
        )}

        {sessionId && !isDemo && (
          <p className="text-xs text-gray-400 mt-2 mb-4 font-mono break-all">
            Order ID: {sessionId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href="/store"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse More Products
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
