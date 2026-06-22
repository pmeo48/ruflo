'use client'

import { useState, useEffect } from 'react'
import {
  FlaskConical, Plus, Play, Pause, Trophy, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle, Clock, Archive, FileEdit
} from 'lucide-react'
import { ABTest, ABVariant, ABTestMetric, ABVariantType, computeWinner, getVariantMetricValue, getMetricLabel, getMetricUnit } from '@/lib/abtesting'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: <FileEdit className="w-3.5 h-3.5" /> },
  running: { label: 'Running', color: 'bg-green-100 text-green-700', icon: <Play className="w-3.5 h-3.5" /> },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700', icon: <Pause className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: <Archive className="w-3.5 h-3.5" /> },
}

const VARIANT_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500']
const VARIANT_LIGHT = ['bg-indigo-50 border-indigo-200', 'bg-violet-50 border-violet-200', 'bg-fuchsia-50 border-fuchsia-200', 'bg-pink-50 border-pink-200']

const METRICS: { value: ABTestMetric; label: string }[] = [
  { value: 'conversion_rate', label: 'Conversion Rate' },
  { value: 'clicks', label: 'Click-Through Rate' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'favorites', label: 'Favorites' },
]

const VARIANT_TYPES: { value: ABVariantType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'description', label: 'Description' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'cta', label: 'Call-to-Action' },
]

function VariantBar({ variant, allVariants, metric, isWinner }: {
  variant: ABVariant
  allVariants: ABVariant[]
  metric: ABTestMetric
  isWinner: boolean
}) {
  const value = getVariantMetricValue(variant, metric)
  const maxValue = Math.max(...allVariants.map(v => getVariantMetricValue(v, metric)), 0.001)
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  const unit = getMetricUnit(metric)
  const idx = allVariants.findIndex(v => v.id === variant.id)

  return (
    <div className={`border rounded-xl p-4 ${isWinner ? VARIANT_LIGHT[idx % 4] : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${VARIANT_COLORS[idx % 4]}`}>
            {variant.label}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" title={variant.value}>
            {variant.value}
          </span>
          {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {unit === '$' ? `$${value.toFixed(0)}` : `${value.toFixed(2)}${unit}`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${VARIANT_COLORS[idx % 4]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
        <div><span className="font-semibold text-gray-700">{variant.impressions.toLocaleString()}</span> impr.</div>
        <div><span className="font-semibold text-gray-700">{variant.clicks.toLocaleString()}</span> clicks</div>
        <div><span className="font-semibold text-gray-700">{variant.conversions}</span> conv.</div>
        <div><span className="font-semibold text-gray-700">${variant.revenue.toLocaleString()}</span> rev.</div>
      </div>
    </div>
  )
}

function TestCard({ test }: { test: ABTest }) {
  const [expanded, setExpanded] = useState(test.status === 'running')
  const { winnerId, confidence, lift } = computeWinner(test)
  const status = STATUS_CONFIG[test.status]
  const totalImpressions = test.variants.reduce((s, v) => s + v.impressions, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{test.name}</h3>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
            {test.status === 'running' && confidence >= 95 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Statistical winner found
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{test.productName} · Testing: <span className="font-medium capitalize">{getMetricLabel(test.metric)}</span></p>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            <span>{test.variants.length} variants</span>
            {totalImpressions > 0 && <span>{totalImpressions.toLocaleString()} total impressions</span>}
            {confidence > 0 && <span className={confidence >= 95 ? 'text-green-600 font-medium' : ''}>{confidence}% confidence</span>}
            {lift > 0 && <span className="text-green-600">+{lift.toFixed(1)}% lift</span>}
          </div>
        </div>
        <button className="text-gray-400 ml-3 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* Confidence bar */}
          {confidence > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Statistical Confidence</span>
                <span className={`font-semibold ${confidence >= 95 ? 'text-green-600' : confidence >= 80 ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {confidence}%
                  {confidence >= 95 ? ' — Significant!' : confidence >= 80 ? ' — Getting there' : ' — Need more data'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className={`h-full rounded-full ${confidence >= 95 ? 'bg-green-500' : confidence >= 80 ? 'bg-yellow-400' : 'bg-gray-300'}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}

          {/* Variant bars */}
          <div className="space-y-3">
            {test.variants.map((variant) => (
              <VariantBar
                key={variant.id}
                variant={variant}
                allVariants={test.variants}
                metric={test.metric}
                isWinner={winnerId === variant.id || test.winnerVariantId === variant.id}
              />
            ))}
          </div>

          {/* Winner announcement */}
          {test.winnerVariantId && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold">
                  Variant {test.variants.find(v => v.id === test.winnerVariantId)?.label} won
                </span>
                {lift > 0 && <span> with +{lift.toFixed(1)}% improvement at {confidence}% confidence.</span>}
                {test.notes && <p className="mt-1 text-amber-700">{test.notes}</p>}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
            <span>Created {new Date(test.createdAt).toLocaleDateString()}</span>
            {test.startedAt && <span>Started {new Date(test.startedAt).toLocaleDateString()}</span>}
            {test.endedAt && <span>Ended {new Date(test.endedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

const EMPTY_VARIANT = { type: 'title' as ABVariantType, value: '' }

export default function ABTestingPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<ABTest['status'] | 'all'>('all')
  const [form, setForm] = useState({
    name: '',
    productId: MOCK_PRODUCTS[0].id,
    metric: 'conversion_rate' as ABTestMetric,
    notes: '',
    variants: [{ ...EMPTY_VARIANT }, { ...EMPTY_VARIANT }],
  })

  useEffect(() => { fetchTests() }, [])

  async function fetchTests() {
    setLoading(true)
    const res = await fetch('/api/abtesting')
    const data = await res.json()
    setTests(data.tests || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/abtesting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', productId: MOCK_PRODUCTS[0].id, metric: 'conversion_rate', notes: '', variants: [{ ...EMPTY_VARIANT }, { ...EMPTY_VARIANT }] })
      fetchTests()
    }
  }

  function updateVariant(idx: number, field: 'type' | 'value', val: string) {
    const next = [...form.variants]
    next[idx] = { ...next[idx], [field]: val }
    setForm({ ...form, variants: next })
  }

  const filtered = filter === 'all' ? tests : tests.filter(t => t.status === filter)
  const running = tests.filter(t => t.status === 'running').length
  const completed = tests.filter(t => t.status === 'completed').length
  const avgConfidence = tests.filter(t => t.confidenceLevel).reduce((s, t) => s + (t.confidenceLevel ?? 0), 0) / (tests.filter(t => t.confidenceLevel).length || 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
            <p className="text-gray-500 text-sm">Test titles, prices, descriptions, and CTAs to maximize conversions</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Tests</p>
          <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600">Running</p>
          <p className="text-2xl font-bold text-green-700">{running}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600">Completed</p>
          <p className="text-2xl font-bold text-blue-700">{completed}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600">Avg Confidence</p>
          <p className="text-2xl font-bold text-amber-700">{avgConfidence.toFixed(0)}%</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New A/B Test</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Test Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Homepage title test"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                <select
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Primary Metric</label>
                <select
                  value={form.metric}
                  onChange={e => setForm({ ...form, metric: e.target.value as ABTestMetric })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Hypothesis or context"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Variants</label>
                {form.variants.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, variants: [...form.variants, { ...EMPTY_VARIANT }] })}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Variant
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${VARIANT_COLORS[i % 4]}`}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <select
                      value={v.type}
                      onChange={e => updateVariant(i, 'type', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm w-36"
                    >
                      {VARIANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      required
                      value={v.value}
                      onChange={e => updateVariant(i, 'value', e.target.value)}
                      placeholder={`Variant ${['A', 'B', 'C', 'D'][i]} content`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    {form.variants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Create Test
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'running', 'draft', 'paused', 'completed'] as const).map(f => {
          const count = f === 'all' ? tests.length : tests.filter(t => t.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f} ({count})
            </button>
          )
        })}
        <button onClick={fetchTests} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tests List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading tests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No tests yet. Create your first A/B test to start optimizing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(test => <TestCard key={test.id} test={test} />)}
        </div>
      )}

      {/* Info box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-sm text-indigo-700">
        <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
        <div>
          <p className="font-medium mb-0.5">How A/B testing works</p>
          <p className="text-xs text-indigo-600">
            Traffic is split equally across variants. A winner is declared when confidence reaches 95%+.
            We recommend running tests for at least 2 weeks and 500+ impressions per variant before concluding.
          </p>
        </div>
      </div>
    </div>
  )
}
