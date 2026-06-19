'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Copy, Check, DollarSign, MousePointer, TrendingUp, RefreshCw } from 'lucide-react'
import type { AffiliateStats } from '@/lib/affiliates'

interface DashboardData {
  affiliates: AffiliateStats[]
  stats: {
    totalEarnings: number
    totalUnpaid: number
    totalClicks: number
    affiliateCount: number
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
      title="Copy link"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function AffiliatesPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRate, setFormRate] = useState('30')
  const [submitting, setSubmitting] = useState(false)
  const [newAffiliate, setNewAffiliate] = useState<AffiliateStats | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourstore.com'

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch affiliates', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail, commissionRate: Number(formRate) }),
      })
      const json = await res.json()
      if (json.affiliate) {
        setNewAffiliate(json.affiliate)
        setFormName('')
        setFormEmail('')
        setFormRate('30')
        await fetchData()
        showToast('Affiliate created successfully!')
      }
    } catch (err) {
      console.error('Failed to create affiliate', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async (affiliate: AffiliateStats) => {
    setPayingId(affiliate.id)
    try {
      await fetch(`/api/affiliates/${affiliate.id}/pay`, { method: 'POST' })
      await fetchData()
      showToast(`Marked ${affiliate.name}'s balance as paid.`)
    } catch (err) {
      console.error('Pay failed', err)
    } finally {
      setPayingId(null)
    }
  }

  const handleToggleStatus = async (affiliate: AffiliateStats) => {
    const newStatus = affiliate.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: 'update_status', id: affiliate.id, status: newStatus }),
      })
      if (res.ok) await fetchData()
    } catch (err) {
      console.error('Toggle failed', err)
    }
  }

  const handlePayAll = async () => {
    if (!data) return
    const unpaid = data.affiliates.filter(a => a.unpaidEarnings > 0)
    await Promise.all(unpaid.map(a => fetch(`/api/affiliates/${a.id}/pay`, { method: 'POST' })))
    await fetchData()
    showToast('All unpaid balances marked as paid.')
  }

  const referralLink = (code: string) => `${storeUrl}/store?ref=${code}`

  const stats = data?.stats
  const affiliates = data?.affiliates ?? []

  return (
    <div>
      <Header title="Affiliate Program" subtitle="Manage affiliates, commissions, and referral links" />
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Action row */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setNewAffiliate(null) }}>
            <Users className="w-3.5 h-3.5" />
            {showForm ? 'Close Form' : 'Add Affiliate'}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Affiliates</p>
                <p className="text-xl font-bold text-gray-900">{stats?.affiliateCount ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Clicks</p>
                <p className="text-xl font-bold text-gray-900">{(stats?.totalClicks ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Commissions Paid</p>
                <p className="text-xl font-bold text-gray-900">${(stats?.totalEarnings ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unpaid Balance</p>
                  <p className="text-xl font-bold text-gray-900">${(stats?.totalUnpaid ?? 0).toFixed(2)}</p>
                </div>
              </div>
              {(stats?.totalUnpaid ?? 0) > 0 && (
                <Button size="sm" variant="secondary" onClick={handlePayAll}>
                  Pay All
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Add Affiliate Form */}
        {showForm && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add New Affiliate</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <Input
                label="Name"
                placeholder="Jane Smith"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="jane@example.com"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                required
              />
              <Input
                label="Commission Rate (%)"
                type="number"
                min="1"
                max="100"
                value={formRate}
                onChange={e => setFormRate(e.target.value)}
              />
              <Button type="submit" isLoading={submitting}>
                Create Affiliate
              </Button>
            </form>

            {newAffiliate && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Affiliate created!</p>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="font-mono">{referralLink(newAffiliate.code)}</span>
                  <CopyButton text={referralLink(newAffiliate.code)} />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Affiliates Table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Affiliates</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading...</div>
          ) : affiliates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No affiliates yet. Add your first affiliate above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Affiliate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Referral Link</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clicks / Conv / CR</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Earned / Unpaid</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {affiliates.map(affiliate => (
                    <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{affiliate.name}</div>
                        <div className="text-xs text-gray-400">{affiliate.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 max-w-xs">
                          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded truncate">
                            {affiliate.code}
                          </span>
                          <CopyButton text={referralLink(affiliate.code)} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-gray-900">{affiliate.commissionRate}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-gray-700">{affiliate.totalClicks.toLocaleString()}</span>
                        <span className="text-gray-400 mx-1">|</span>
                        <span className="text-gray-700">{affiliate.totalConversions}</span>
                        <span className="text-gray-400 mx-1">|</span>
                        <span className="text-green-600 font-medium">{affiliate.conversionRate}%</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-gray-900">${affiliate.totalEarnings.toFixed(2)}</div>
                        <div className="text-xs text-orange-600">${affiliate.unpaidEarnings.toFixed(2)} unpaid</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={affiliate.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {affiliate.unpaidEarnings > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={payingId === affiliate.id}
                              onClick={() => handlePay(affiliate)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(affiliate)}
                          >
                            {affiliate.status === 'active' ? 'Pause' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
