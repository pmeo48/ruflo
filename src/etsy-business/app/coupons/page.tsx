'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Copy, Pause, Play, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Coupon, CouponType } from '@/lib/types'

const TYPE_LABELS: Record<CouponType, string> = {
  percentage: '% Off',
  fixed: '$ Off',
  free_shipping: 'Free Shipping',
}

const TYPE_COLORS: Record<CouponType, string> = {
  percentage: 'bg-purple-100 text-purple-700',
  fixed: 'bg-green-100 text-green-700',
  free_shipping: 'bg-blue-100 text-blue-700',
}

const STATUS_ICONS = {
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  paused: <Clock className="w-4 h-4 text-yellow-500" />,
  expired: <AlertCircle className="w-4 h-4 text-red-400" />,
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    prefix: '',
    description: '',
    type: 'percentage' as CouponType,
    value: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
  })

  useEffect(() => { fetchCoupons() }, [])

  async function fetchCoupons() {
    setLoading(true)
    const res = await fetch('/api/coupons')
    const data = await res.json()
    setCoupons(data.coupons || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ code: '', prefix: '', description: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
      fetchCoupons()
    }
  }

  async function handleAction(id: string, action: 'status' | 'delete', extra?: object) {
    await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: action, id, ...extra }),
    })
    fetchCoupons()
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = coupons.filter((c) => c.status === 'active').length
  const totalUses = coupons.reduce((s, c) => s + c.usedCount, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Ticket className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
            <p className="text-gray-500 text-sm">Create and manage discount codes to boost conversions</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Redemptions</p>
          <p className="text-2xl font-bold text-purple-600">{totalUses}</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Coupon</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code (leave blank to auto-generate)</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. SUMMER25"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix for auto-code</label>
              <input
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                placeholder="e.g. DEAL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Internal note for this coupon"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.type === 'percentage' ? 'Discount %' : form.type === 'fixed' ? 'Discount $' : 'Value (unused)'}
              </label>
              <input
                required
                type="number"
                min="0"
                max={form.type === 'percentage' ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percentage' ? '20' : '10'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount ($)</label>
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No coupons yet. Create your first one!</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{c.code}</code>
                    <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {copied === c.code ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[c.type]}`}>
                      {TYPE_LABELS[c.type]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `$${c.value}` : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''} uses
                  {c.minOrderAmount ? <div className="text-xs text-gray-400">Min ${c.minOrderAmount}</div> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICONS[c.status]}
                    <span className="text-sm capitalize text-gray-700">{c.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.status === 'active' ? (
                      <button
                        onClick={() => handleAction(c.id, 'status', { status: 'paused' })}
                        className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : c.status === 'paused' ? (
                      <button
                        onClick={() => handleAction(c.id, 'status', { status: 'active' })}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => { if (confirm('Delete this coupon?')) handleAction(c.id, 'delete') }}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
