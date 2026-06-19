'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Download, Clock, CheckCircle, RefreshCw, ExternalLink, TrendingUp } from 'lucide-react'
import { Order } from '@/lib/orders'

const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-blue-100 text-blue-700',
  spreadsheet: 'bg-green-100 text-green-700',
  notion: 'bg-purple-100 text-purple-700',
  'prompt-pack': 'bg-orange-100 text-orange-700',
  bundle: 'bg-indigo-100 text-indigo-700',
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Guide',
  spreadsheet: 'Spreadsheet',
  notion: 'Notion Template',
  'prompt-pack': 'Prompt Pack',
  bundle: 'Bundle',
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${minutes}m ago`
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ totalRevenue: 0, completedOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data.orders || [])
    setStats({ totalRevenue: data.totalRevenue || 0, completedOrders: data.completedOrders || 0 })
    setLoading(false)
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const avgOrder = stats.completedOrders > 0 ? stats.totalRevenue / stats.completedOrders : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders & Downloads</h1>
            <p className="text-gray-500 text-sm">Track sales, manage delivery, and monitor download activity</p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-indigo-600">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">Avg Order Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${avgOrder.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'completed', 'pending', 'refunded'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? `All (${orders.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Download</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No orders yet. Share your storefront to start selling!</p>
                </td>
              </tr>
            ) : filtered.map((order) => {
              const expiresIn = Math.max(0, Math.floor((new Date(order.downloadExpiresAt).getTime() - Date.now()) / 86400000))
              const isExpired = expiresIn === 0
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{order.productName}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[order.productType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[order.productType] ?? order.productType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">${order.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {order.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : order.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    ) : (
                      <span className="text-red-500 text-xs font-medium">Refunded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={order.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            isExpired
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Download className="w-3 h-3" />
                          {isExpired ? 'Expired' : 'Download'}
                        </a>
                        {!isExpired && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {expiresIn}d left
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-600">{timeAgo(order.createdAt)}</p>
                      {order.customerEmail && (
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{order.customerEmail}</p>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">Automatic download delivery</p>
          <p className="text-blue-600 text-xs">
            Download links are automatically emailed to customers after purchase via Resend.
            Connect Supabase Storage to serve real product files. Each link expires after 30 days.
          </p>
        </div>
      </div>
    </div>
  )
}
