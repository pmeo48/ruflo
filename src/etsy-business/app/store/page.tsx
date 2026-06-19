'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { Product, ProductType } from '@/lib/types'
import { ShoppingCart, Zap, Star, Shield, RefreshCw, Download } from 'lucide-react'

const TYPE_LABELS: Record<ProductType, string> = {
  pdf: 'PDF Guide',
  spreadsheet: 'Spreadsheet',
  notion: 'Notion',
  'prompt-pack': 'Prompt Pack',
  bundle: 'Bundle',
}

const TYPE_COLORS: Record<ProductType, string> = {
  pdf: 'bg-blue-100 text-blue-700',
  spreadsheet: 'bg-green-100 text-green-700',
  notion: 'bg-purple-100 text-purple-700',
  'prompt-pack': 'bg-orange-100 text-orange-700',
  bundle: 'bg-indigo-100 text-indigo-700',
}

const FILTER_TABS: { label: string; value: ProductType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'PDF Guides', value: 'pdf' },
  { label: 'Spreadsheets', value: 'spreadsheet' },
  { label: 'Notion', value: 'notion' },
  { label: 'Prompt Packs', value: 'prompt-pack' },
]

function ProductCard({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false)

  const handleBuyNow = async () => {
    setLoading(true)
    try {
      const affiliateCode = typeof window !== 'undefined' ? sessionStorage.getItem('affiliate_ref') : null
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          description: product.description,
          ...(affiliateCode ? { affiliateCode } : {}),
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const isFeatured = product.id === '10'

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border flex flex-col overflow-hidden transition-shadow hover:shadow-md ${
        isFeatured ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-100'
      }`}
    >
      {isFeatured && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 text-center tracking-wide uppercase">
          Most Popular — Best Value
        </div>
      )}

      {/* Mockup image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-indigo-900 flex items-center justify-center">
        <span className="text-white/40 text-sm font-medium text-center px-4">{product.name}</span>
        {product.compareAtPrice && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Type badge */}
        <span
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 w-fit ${TYPE_COLORS[product.type]}`}
        >
          {TYPE_LABELS[product.type]}
        </span>

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{product.name}</h3>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold text-gray-700">
            {product.avgRating ?? 4.9} ({product.reviewCount} reviews)
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-black text-green-600">${product.price}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">${product.compareAtPrice}</span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleBuyNow}
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mb-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Buy Now
            </>
          )}
        </button>
        <button className="w-full py-2 px-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}

function AffiliateTracker() {
  const searchParams = useSearchParams()
  const trackedRef = useRef(false)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && !trackedRef.current) {
      trackedRef.current = true
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('affiliate_ref', ref)
      }
      fetch('/api/affiliates/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(() => {/* silent */})
    }
  }, [searchParams])

  return null
}

export default function StorePage() {
  const [activeFilter, setActiveFilter] = useState<ProductType | 'all'>('all')

  const activeProducts = MOCK_PRODUCTS.filter(p => p.status === 'active')
  const featuredProduct = activeProducts.find(p => p.id === '10')
  const filteredProducts = activeProducts.filter(p => {
    if (activeFilter === 'all') return true
    return p.type === activeFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}><AffiliateTracker /></Suspense>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900">AI Digital Product Store</h1>
            <p className="text-xs text-gray-500">Premium AI tools for modern professionals</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Secure checkout via Stripe
          </div>
        </div>
      </header>

      {/* Hero stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-8 text-sm font-medium">
          <span>10+ Products</span>
          <span className="opacity-40">|</span>
          <span>1,200+ Happy Customers</span>
          <span className="opacity-40">|</span>
          <span>Instant Digital Delivery</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Featured product */}
        {featuredProduct && (
          <div className="mb-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full mb-3 uppercase tracking-wide">
                Featured — Best Value
              </span>
              <h2 className="text-2xl font-black mb-2">{featuredProduct.name}</h2>
              <p className="text-indigo-200 text-sm mb-4 max-w-lg">{featuredProduct.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black">${featuredProduct.price}</span>
                {featuredProduct.compareAtPrice && (
                  <span className="text-indigo-300 line-through text-lg">${featuredProduct.compareAtPrice}</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <FeaturedBuyButton product={featuredProduct} />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No products in this category yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Instant digital delivery</span>
          <span className="hidden sm:block opacity-30">•</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Secure checkout via Stripe</span>
          <span className="hidden sm:block opacity-30">•</span>
          <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />30-day guarantee</span>
        </div>
      </footer>
    </div>
  )
}

function FeaturedBuyButton({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(true)
    try {
      const affiliateCode = typeof window !== 'undefined' ? sessionStorage.getItem('affiliate_ref') : null
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          description: product.description,
          ...(affiliateCode ? { affiliateCode } : {}),
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full md:w-auto px-8 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed text-yellow-900 font-black text-base rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-yellow-900/30 border-t-yellow-900 rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Zap className="w-5 h-5" />
          Get Instant Access — ${product.price}
        </>
      )}
    </button>
  )
}
