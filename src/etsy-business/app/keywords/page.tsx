'use client'

import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, Sparkles, Copy, Check, ArrowUpRight } from 'lucide-react'
import type { KeywordResearchResult, KeywordData } from '@/lib/keywords'

const VOLUME_COLORS: Record<string, string> = {
  'Very High': 'text-green-700 bg-green-50',
  High: 'text-green-600 bg-green-50',
  Medium: 'text-yellow-700 bg-yellow-50',
  Low: 'text-orange-600 bg-orange-50',
  'Very Low': 'text-gray-500 bg-gray-100',
}

const COMPETITION_COLORS: Record<string, string> = {
  'Very High': 'text-red-700 bg-red-50',
  High: 'text-red-500 bg-red-50',
  Medium: 'text-yellow-700 bg-yellow-50',
  Low: 'text-green-600 bg-green-50',
  'Very Low': 'text-green-700 bg-green-50',
}

const INTENT_COLORS: Record<string, string> = {
  High: 'text-indigo-700 bg-indigo-50',
  Medium: 'text-blue-600 bg-blue-50',
  Low: 'text-gray-500 bg-gray-100',
}

function TrendIcon({ trend }: { trend: KeywordData['trend'] }) {
  if (trend === 'Rising') return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend === 'Declining') return <TrendingDown className="h-4 w-4 text-red-400" />
  return <Minus className="h-4 w-4 text-gray-400" />
}

function OpportunityBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-7 text-right ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
        {score}
      </span>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

const POPULAR_SEEDS = [
  'business planner', 'social media template', 'budget tracker', 'wedding checklist',
  'meal planner', 'notion template', 'resume template', 'invoice template',
]

export default function KeywordsPage() {
  const [seed, setSeed] = useState('')
  const [result, setResult] = useState<KeywordResearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedKeywords, setSavedKeywords] = useState<Set<string>>(new Set())

  async function research(value?: string) {
    const query = (value ?? seed).trim()
    if (!query) return
    if (value) setSeed(value)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: query }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function toggleSave(keyword: string) {
    setSavedKeywords((prev) => {
      const next = new Set(prev)
      if (next.has(keyword)) next.delete(keyword)
      else next.add(keyword)
      return next
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Search className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Keyword Research</h1>
        </div>
        <p className="text-gray-600">Find high-opportunity keywords for your Etsy digital products with competition and trend analysis.</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && research()}
              placeholder="Enter a seed keyword (e.g. business planner, social media template)…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => research()}
            disabled={loading || !seed.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
            {loading ? 'Researching…' : 'Research'}
          </button>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEEDS.map((s) => (
              <button
                key={s}
                onClick={() => research(s)}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          {/* Top opportunities */}
          {result.topOpportunities.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Top Opportunities for "{result.seed}"
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.topOpportunities.map((kw) => (
                  <div key={kw} className="flex items-center gap-1 bg-white border border-teal-200 rounded-full px-3 py-1">
                    <span className="text-sm text-teal-800">{kw}</span>
                    <CopyBtn text={kw} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {result.keywords.length} Keywords Found
                {savedKeywords.size > 0 && <span className="ml-2 text-sm text-teal-600 font-normal">{savedKeywords.size} saved</span>}
              </h2>
              {savedKeywords.size > 0 && (
                <button
                  onClick={() => { navigator.clipboard.writeText(Array.from(savedKeywords).join(', ')) }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy saved
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">Keyword</th>
                    <th className="px-4 py-3 text-left font-medium">Volume</th>
                    <th className="px-4 py-3 text-left font-medium">Competition</th>
                    <th className="px-4 py-3 text-left font-medium">Trend</th>
                    <th className="px-4 py-3 text-left font-medium">Intent</th>
                    <th className="px-4 py-3 text-left font-medium">Avg Price</th>
                    <th className="px-4 py-3 text-left font-medium w-32">Opportunity</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.keywords.map((kw) => (
                    <tr key={kw.keyword} className={`hover:bg-gray-50 transition-colors ${savedKeywords.has(kw.keyword) ? 'bg-teal-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{kw.keyword}</span>
                          <CopyBtn text={kw.keyword} />
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {kw.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${VOLUME_COLORS[kw.searchVolume]}`}>
                          {kw.searchVolume}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${COMPETITION_COLORS[kw.competition]}`}>
                          {kw.competition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TrendIcon trend={kw.trend} />
                          <span className="text-xs text-gray-600">{kw.trend}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${INTENT_COLORS[kw.buyerIntent]}`}>
                          {kw.buyerIntent}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs font-medium">{kw.avgPrice}</td>
                      <td className="px-4 py-3 w-32">
                        <OpportunityBar score={kw.opportunity} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSave(kw.keyword)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            savedKeywords.has(kw.keyword)
                              ? 'bg-teal-100 border-teal-300 text-teal-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {savedKeywords.has(kw.keyword) ? '✓' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Title snippets */}
          {result.titleSnippets.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Suggested Title Templates</h2>
              <div className="space-y-2">
                {result.titleSnippets.map((t) => (
                  <div key={t} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="flex-1 text-sm text-gray-700">{t}</p>
                    <CopyBtn text={t} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Strategic Insights</h2>
              <ul className="space-y-2">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ArrowUpRight className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">Enter a keyword to begin</p>
          <p className="text-sm mt-1">Try "business planner" or "social media template" to see an example.</p>
        </div>
      )}
    </div>
  )
}
