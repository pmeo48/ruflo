'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Minus, Zap, BarChart2, AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { PriceAnalysis, PRICING_STRATEGIES } from '@/lib/pricing'

const POSITION_CONFIG = {
  underpriced: {
    label: 'Underpriced',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  competitive: {
    label: 'Well Priced',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: <Minus className="w-4 h-4" />,
  },
  overpriced: {
    label: 'Overpriced',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: <TrendingDown className="w-4 h-4" />,
  },
}

const CONFIDENCE_COLORS = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-500',
}

const STRATEGY_COLORS: Record<string, string> = {
  penetration: 'bg-orange-100 text-orange-700',
  competitive: 'bg-blue-100 text-blue-700',
  value: 'bg-purple-100 text-purple-700',
  premium: 'bg-indigo-100 text-indigo-700',
}

function ElasticityBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? 'bg-red-400' : score >= 4 ? 'bg-yellow-400' : 'bg-green-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{score}</span>
    </div>
  )
}

function AnalysisCard({ analysis, onApply }: { analysis: PriceAnalysis; onApply: (id: string, price: number) => void }) {
  const pos = POSITION_CONFIG[analysis.marketPosition]
  const priceDiff = analysis.recommendedPrice - analysis.currentPrice
  const priceDiffPct = ((priceDiff / analysis.currentPrice) * 100).toFixed(1)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border rounded-xl overflow-hidden ${pos.bg}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{analysis.productName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${pos.badge}`}>
                {pos.icon} {pos.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STRATEGY_COLORS[analysis.strategy]}`}>
                {analysis.strategy}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">Current</p>
            <p className="text-lg font-black text-gray-900">${analysis.currentPrice}</p>
          </div>
        </div>

        {/* Price recommendation */}
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 mb-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Recommended Price</p>
            <p className="text-2xl font-black text-indigo-600">${analysis.recommendedPrice}</p>
          </div>
          <div className="text-center px-3 border-x border-gray-100">
            <p className="text-xs text-gray-500 mb-0.5">Change</p>
            <p className={`text-lg font-bold ${priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {priceDiff > 0 ? '+' : ''}{priceDiff !== 0 ? `$${Math.abs(priceDiff)}` : '—'}
            </p>
            {priceDiff !== 0 && (
              <p className={`text-xs ${priceDiff > 0 ? 'text-green-500' : 'text-red-400'}`}>
                ({priceDiff > 0 ? '+' : ''}{priceDiffPct}%)
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Rev. Impact</p>
            <p className={`text-lg font-bold ${analysis.expectedRevenueChange > 0 ? 'text-green-600' : analysis.expectedRevenueChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {analysis.expectedRevenueChange > 0 ? '+' : ''}{analysis.expectedRevenueChange}%
            </p>
          </div>
        </div>

        {/* Confidence + elasticity */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">AI Confidence</p>
            <p className={`text-sm font-semibold capitalize ${CONFIDENCE_COLORS[analysis.confidence]}`}>
              {analysis.confidence}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price Sensitivity</p>
            <ElasticityBar score={analysis.elasticityScore} />
          </div>
        </div>

        {/* Reason */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{analysis.reason}</p>

        {/* Insights toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mb-3"
        >
          <Info className="w-3 h-3" />
          {expanded ? 'Hide' : 'Show'} insights
        </button>

        {expanded && (
          <ul className="space-y-1.5 mb-3">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                {insight}
              </li>
            ))}
          </ul>
        )}

        {/* Price range bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>${analysis.minPrice}</span>
            <span className="text-gray-600 font-medium">Optimal range</span>
            <span>${analysis.maxPrice}</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full">
            <div
              className="absolute h-2 bg-indigo-200 rounded-full"
              style={{
                left: `${((analysis.minPrice - analysis.minPrice * 0.8) / (analysis.maxPrice * 1.2 - analysis.minPrice * 0.8)) * 100}%`,
                right: `${100 - ((analysis.maxPrice - analysis.minPrice * 0.8) / (analysis.maxPrice * 1.2 - analysis.minPrice * 0.8)) * 100}%`,
              }}
            />
            {/* Current price marker */}
            <div
              className="absolute w-2.5 h-2.5 bg-gray-600 rounded-full -top-0.5"
              style={{
                left: `${Math.min(95, Math.max(2, ((analysis.currentPrice - analysis.minPrice * 0.8) / (analysis.maxPrice * 1.2 - analysis.minPrice * 0.8)) * 100))}%`,
              }}
              title={`Current: $${analysis.currentPrice}`}
            />
            {/* Recommended price marker */}
            <div
              className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full -top-0.5"
              style={{
                left: `${Math.min(95, Math.max(2, ((analysis.recommendedPrice - analysis.minPrice * 0.8) / (analysis.maxPrice * 1.2 - analysis.minPrice * 0.8)) * 100))}%`,
              }}
              title={`Recommended: $${analysis.recommendedPrice}`}
            />
          </div>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-600 rounded-full inline-block" /> Current</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-600 rounded-full inline-block" /> Recommended</span>
          </div>
        </div>

        {/* Apply button */}
        {priceDiff !== 0 && (
          <button
            onClick={() => onApply(analysis.productId, analysis.recommendedPrice)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Apply ${analysis.recommendedPrice} to Product
          </button>
        )}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [analyses, setAnalyses] = useState<PriceAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'underpriced' | 'overpriced' | 'competitive'>('all')

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      const data = await res.json()
      setAnalyses(data.analyses || [])
    } finally {
      setLoading(false)
    }
  }

  async function runSingle(productId: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.analysis) {
        setAnalyses((prev) => {
          const existing = prev.findIndex((a) => a.productId === productId)
          if (existing >= 0) {
            const next = [...prev]
            next[existing] = data.analysis
            return next
          }
          return [...prev, data.analysis]
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleApply(productId: string, price: number) {
    setApplied((prev) => ({ ...prev, [productId]: price }))
    // In production: call Etsy API to update listing price
  }

  const filtered = filter === 'all' ? analyses : analyses.filter((a) => a.marketPosition === filter)

  const totalOpportunity = analyses.reduce((sum, a) => {
    if (a.expectedRevenueChange > 0) return sum + a.expectedRevenueChange
    return sum
  }, 0)

  const underpricedCount = analyses.filter((a) => a.marketPosition === 'underpriced').length
  const overpricedCount = analyses.filter((a) => a.marketPosition === 'overpriced').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Price Optimizer</h1>
            <p className="text-gray-500 text-sm">AI-powered pricing analysis to maximize your revenue</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors text-sm font-medium"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze All Products'}
        </button>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRICING_STRATEGIES.map((s) => (
          <div key={s.name} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-900 mb-1">{s.name}</p>
            <p className="text-xs text-gray-500 mb-2">{s.description}</p>
            <p className="text-xs text-indigo-600 font-medium">{Math.round(s.targetMargin * 100)}% margin target</p>
          </div>
        ))}
      </div>

      {analyses.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Products Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-600">Underpriced</p>
              <p className="text-2xl font-bold text-green-700">{underpricedCount}</p>
              <p className="text-xs text-green-500">↑ Price increases available</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-500">Overpriced</p>
              <p className="text-2xl font-bold text-red-600">{overpricedCount}</p>
              <p className="text-xs text-red-400">↓ May be losing conversions</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs text-indigo-600">Total Revenue Opportunity</p>
              <p className="text-2xl font-bold text-indigo-700">+{totalOpportunity.toFixed(0)}%</p>
              <p className="text-xs text-indigo-400">by applying recommendations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'underpriced', 'competitive', 'overpriced'] as const).map((f) => {
              const count = f === 'all' ? analyses.length : analyses.filter((a) => a.marketPosition === f).length
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f === 'all' ? 'All' : f} ({count})
                </button>
              )
            })}
          </div>

          {/* Applied notice */}
          {Object.keys(applied).length > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              {Object.keys(applied).length} price{Object.keys(applied).length > 1 ? 's' : ''} queued for update.
              Connect Etsy API in Settings to auto-apply.
            </div>
          )}

          {/* Analysis grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((analysis) => (
              <AnalysisCard
                key={analysis.productId}
                analysis={analysis}
                onApply={handleApply}
              />
            ))}
          </div>
        </>
      )}

      {analyses.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to optimize your prices</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Click "Analyze All Products" to run AI-powered pricing analysis across your entire catalog.
            With OpenAI configured, analysis uses GPT-4 market intelligence. Otherwise uses rule-based signals.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-xs text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p>Spot underpriced products</p>
            </div>
            <div className="text-center">
              <BarChart2 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p>Competitor benchmarking</p>
            </div>
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p>Conversion rate signals</p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            Run Price Analysis
          </button>
        </div>
      )}
    </div>
  )
}
