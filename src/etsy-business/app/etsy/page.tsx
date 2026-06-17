'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, Plus, ExternalLink, RefreshCw,
  CheckCircle, Clock, AlertCircle, Zap, Upload, Eye,
} from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { Product } from '@/lib/types'

type EtsyStatus = 'not-listed' | 'draft' | 'active'

interface ProductEtsyState {
  status: EtsyStatus
  listingId?: string
  loading?: boolean
}

interface EtsyListing {
  listing_id: string | number
  title: string
  state: string
  price?: { amount: number; divisor: number }
  url?: string
}

interface ToastMsg {
  text: string
  type: 'success' | 'error'
}

function statusBadge(status: EtsyStatus) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    )
  }
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800">
        <Clock className="w-3 h-3" /> Draft
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
      <AlertCircle className="w-3 h-3" /> Not Listed
    </span>
  )
}

export default function EtsyPage() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS)
  const [etsyStates, setEtsyStates] = useState<Record<string, ProductEtsyState>>(() => {
    const initial: Record<string, ProductEtsyState> = {}
    MOCK_PRODUCTS.forEach((p) => {
      initial[p.id] = {
        status: p.etsyListingId ? 'active' : 'not-listed',
        listingId: p.etsyListingId,
      }
    })
    return initial
  })
  const [shopListings, setShopListings] = useState<EtsyListing[]>([])
  const [shopLoading, setShopLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchShopListings = useCallback(async () => {
    setShopLoading(true)
    try {
      const res = await fetch('/api/etsy/listings')
      const data = await res.json()
      setShopListings(data.listings ?? [])
      setConfigured(data.configured ?? false)
    } catch {
      showToast('Failed to fetch shop listings', 'error')
    } finally {
      setShopLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShopListings()
  }, [fetchShopListings])

  const pushToEtsy = async (product: Product) => {
    setEtsyStates((prev) => ({ ...prev, [product.id]: { ...prev[product.id], loading: true } }))
    try {
      const res = await fetch('/api/etsy/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.name,
          description: product.description,
          price: product.price,
          tags: product.tags,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setEtsyStates((prev) => ({
        ...prev,
        [product.id]: { status: 'draft', listingId: String(data.listing_id), loading: false },
      }))
      showToast(
        configured
          ? `"${product.name}" pushed to Etsy as draft`
          : `"${product.name}" mock-listed (Etsy not configured)`,
        'success',
      )
    } catch (err) {
      setEtsyStates((prev) => ({ ...prev, [product.id]: { ...prev[product.id], loading: false } }))
      showToast(`Failed to push "${product.name}": ${String(err)}`, 'error')
    }
  }

  const publishListing = async (product: Product) => {
    const state = etsyStates[product.id]
    if (!state?.listingId) return
    setEtsyStates((prev) => ({ ...prev, [product.id]: { ...prev[product.id], loading: true } }))
    try {
      const res = await fetch(`/api/etsy/listings/${state.listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Unknown error')
      }
      setEtsyStates((prev) => ({
        ...prev,
        [product.id]: { ...prev[product.id], status: 'active', loading: false },
      }))
      showToast(`"${product.name}" published on Etsy`, 'success')
    } catch (err) {
      setEtsyStates((prev) => ({ ...prev, [product.id]: { ...prev[product.id], loading: false } }))
      showToast(`Failed to publish: ${String(err)}`, 'error')
    }
  }

  const pushAll = async () => {
    const unlisted = products.filter((p) => etsyStates[p.id]?.status === 'not-listed')
    if (unlisted.length === 0) {
      showToast('All products are already listed', 'success')
      return
    }
    setBulkLoading(true)
    await Promise.all(unlisted.map(pushToEtsy))
    setBulkLoading(false)
    showToast(`Pushed ${unlisted.length} products to Etsy`, 'success')
  }

  const totalListings = products.length
  const activeCount = Object.values(etsyStates).filter((s) => s.status === 'active').length
  const draftCount = Object.values(etsyStates).filter((s) => s.status === 'draft').length
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080818' }}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Etsy Listings Manager</h1>
              <p className="text-sm" style={{ color: '#8080a0' }}>
                Manage and sync your products with Etsy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchShopListings}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={pushAll}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {bulkLoading ? 'Pushing...' : 'Push All to Etsy'}
            </button>
          </div>
        </div>

        {/* Connection status banner */}
        <div
          className={`rounded-xl p-4 border flex items-center gap-3 ${
            configured
              ? 'bg-green-900/20 border-green-800'
              : 'bg-amber-900/20 border-amber-800'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${configured ? 'bg-green-400' : 'bg-amber-400'}`} />
          <div>
            <p className={`text-sm font-medium ${configured ? 'text-green-300' : 'text-amber-300'}`}>
              {configured ? 'Connected to Etsy API' : 'Running in Mock Mode'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {configured
                ? 'Changes will be pushed to your live Etsy shop.'
                : 'Add ETSY_API_KEY, ETSY_SHOP_ID, and ETSY_ACCESS_TOKEN to .env.local to go live.'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Listings', value: totalListings, icon: ShoppingBag, color: 'text-indigo-400' },
            { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Drafts', value: draftCount, icon: Clock, color: 'text-amber-400' },
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: Zap, color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 border"
              style={{ backgroundColor: '#0f0f23', borderColor: '#2a2a4a' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Products table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a4a', backgroundColor: '#0f0f23' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#2a2a4a' }}>
            <h2 className="text-sm font-semibold text-white">Your Products</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#2a2a4a' }}>
                {['Product Name', 'Type', 'Price', 'Etsy Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#6060a0' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#2a2a4a' }}>
              {products.map((product) => {
                const state = etsyStates[product.id] ?? { status: 'not-listed' as EtsyStatus }
                return (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description.slice(0, 60)}…</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800 capitalize">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">${product.price}</td>
                    <td className="px-6 py-4">{statusBadge(state.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {state.status === 'not-listed' && (
                          <button
                            onClick={() => pushToEtsy(product)}
                            disabled={state.loading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            {state.loading ? 'Pushing...' : 'Push to Etsy'}
                          </button>
                        )}
                        {state.status === 'draft' && (
                          <>
                            <button
                              onClick={() => publishListing(product)}
                              disabled={state.loading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                              {state.loading ? 'Publishing...' : 'Publish'}
                            </button>
                          </>
                        )}
                        {state.status === 'active' && product.etsyListingUrl && (
                          <a
                            href={product.etsyListingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Etsy
                          </a>
                        )}
                        {state.listingId && (
                          <span className="text-xs text-gray-600 font-mono">#{String(state.listingId).slice(0, 10)}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Shop listings section */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a4a', backgroundColor: '#0f0f23' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#2a2a4a' }}>
            <h2 className="text-sm font-semibold text-white">Your Etsy Shop Listings</h2>
            <Eye className="w-4 h-4 text-gray-500" />
          </div>
          <div className="p-6">
            {shopLoading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                <span className="text-sm text-gray-400">Fetching shop listings…</span>
              </div>
            ) : shopListings.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {configured
                    ? 'No active listings found in your Etsy shop.'
                    : 'Connect your Etsy API to see live shop listings here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {shopListings.map((listing) => (
                  <div
                    key={listing.listing_id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: '#2a2a4a', backgroundColor: '#1a1a3e' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{listing.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {listing.listing_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {listing.price && (
                        <span className="text-sm text-white">
                          ${(listing.price.amount / listing.price.divisor).toFixed(2)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        listing.state === 'active'
                          ? 'bg-green-900/40 text-green-400 border-green-800'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {listing.state}
                      </span>
                      {listing.url && (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-900 border-green-700 text-green-200'
              : 'bg-red-900 border-red-700 text-red-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}
    </div>
  )
}
