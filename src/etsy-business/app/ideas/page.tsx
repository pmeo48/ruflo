'use client'

import { useState } from 'react'
import { Lightbulb, Sparkles, Tag, DollarSign, Users, TrendingUp, RefreshCw } from 'lucide-react'
import type { ProductIdea } from '@/lib/ideas'

const NICHES = [
  'Business & Entrepreneurship',
  'Health & Wellness',
  'Personal Finance',
  'Productivity & Organization',
  'Social Media Marketing',
  'Coaching & Consulting',
  'Creative Arts & Design',
  'Education & E-Learning',
  'Real Estate',
  'Fitness & Nutrition',
]

const PRICE_POINTS = [
  'Budget ($5–$15)',
  'Mid-range ($15–$45)',
  'Premium ($45–$97)',
  'High-ticket ($97+)',
]

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800',
}

export default function IdeasPage() {
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [pricePoint, setPricePoint] = useState('Mid-range ($15–$45)')
  const [count, setCount] = useState(5)
  const [ideas, setIdeas] = useState<ProductIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, audience, pricePoint, count }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIdeas(data.ideas)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Lightbulb className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Product Idea Generator</h1>
        </div>
        <p className="text-gray-600">
          Discover profitable digital product ideas tailored to your niche and audience.
        </p>
      </div>

      {/* Input Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Health & Wellness"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 text-gray-500"
              >
                <option value="">Popular</option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. freelance designers, new moms, small business owners"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Point</label>
            <select
              value={pricePoint}
              onChange={(e) => setPricePoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              {PRICE_POINTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Ideas: <span className="text-purple-600 font-semibold">{count}</span>
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3</span><span>10</span>
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating ideas…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Product Ideas
            </>
          )}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {/* Results */}
      {ideas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {ideas.length} Product Ideas Generated
            </h2>
            <span className="text-sm text-gray-500">
              {saved.size > 0 && `${saved.size} saved`}
            </span>
          </div>

          <div className="space-y-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[idea.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                        {idea.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{idea.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSave(idea.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      saved.has(idea.id)
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {saved.has(idea.id) ? '✓ Saved' : 'Save'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{idea.targetAudience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{idea.priceRange}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>{idea.potentialRevenue}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3 text-sm text-amber-800">
                  <strong>Why it works:</strong> {idea.whyItWorks}
                </div>

                {idea.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={generate}
              className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {ideas.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">No ideas yet</p>
          <p className="text-sm mt-1">Fill in your niche and audience above, then click Generate.</p>
        </div>
      )}
    </div>
  )
}
