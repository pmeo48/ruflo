'use client'

import { useState } from 'react'
import { PenLine, Copy, CheckCircle, Zap, ChevronDown, ChevronUp, Mail, Share2, ShoppingBag, RefreshCw } from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { GeneratedCopy, CopyVariant, TONE_PRESETS } from '@/lib/copywriter'

function CopyBlock({ label, content, mono = false }: { label: string; content: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors font-medium"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className={`p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed ${mono ? 'font-mono text-xs' : ''}`}>
        {content}
      </pre>
    </div>
  )
}

function VariantCard({ variant, active, onSelect }: { variant: CopyVariant; active: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  function copyField(field: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${active ? 'border-indigo-400 shadow-md' : 'border-gray-200'}`}>
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${active ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full border-2 ${active ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{variant.label} Tone</p>
            <p className="text-xs text-gray-500">{TONE_PRESETS.find((t) => t.id === variant.tone)?.description}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className={`border-t border-gray-100 ${expanded ? 'block' : 'hidden'}`}>
        <div className="p-4 space-y-4">
          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Headline</span>
              <button onClick={() => copyField('headline', variant.headline)} className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                {copiedField === 'headline' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="font-bold text-gray-900 text-base">{variant.headline}</p>
          </div>

          {/* Subheadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subheadline</span>
              <button onClick={() => copyField('sub', variant.subheadline)} className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                {copiedField === 'sub' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-gray-700 text-sm italic">{variant.subheadline}</p>
          </div>

          {/* Bullets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bullet Points</span>
              <button onClick={() => copyField('bullets', variant.bullets.join('\n'))} className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                {copiedField === 'bullets' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <ul className="space-y-1">
              {variant.bullets.map((b, i) => (
                <li key={i} className="text-sm text-gray-700">{b}</li>
              ))}
            </ul>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales Description</span>
              <button onClick={() => copyField('desc', variant.description)} className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                {copiedField === 'desc' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{variant.description}</p>
          </div>

          {/* CTA */}
          <div className="bg-indigo-50 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-900">{variant.cta}</span>
            <button onClick={() => copyField('cta', variant.cta)} className="text-xs text-indigo-400 hover:text-indigo-600 flex items-center gap-1">
              {copiedField === 'cta' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              Copy CTA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CopywriterPage() {
  const [selectedProductId, setSelectedProductId] = useState(MOCK_PRODUCTS[0].id)
  const [targetAudience, setTargetAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedCopy | null>(null)
  const [activeVariant, setActiveVariant] = useState(0)
  const [activeTab, setActiveTab] = useState<'variants' | 'etsy' | 'email' | 'social'>('variants')

  const selectedProduct = MOCK_PRODUCTS.find((p) => p.id === selectedProductId)!

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/copywriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, targetAudience }),
      })
      const data = await res.json()
      if (data.copy) {
        setResult(data.copy)
        setActiveVariant(0)
        setActiveTab('variants')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <PenLine className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Copy Writer</h1>
          <p className="text-gray-500 text-sm">Generate conversion-optimized sales copy, Etsy descriptions, and social content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Generate Copy For</h2>

            {/* Product selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {MOCK_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Product preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Type:</span> {selectedProduct.type}</p>
              <p><span className="font-medium">Price:</span> ${selectedProduct.price}</p>
              <p><span className="font-medium">Contents:</span> {selectedProduct.contents.slice(0, 2).join(', ')}...</p>
            </div>

            {/* Target audience */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Target Audience (optional)</label>
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Small business owners looking to automate their workflows with AI"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Zap className="w-4 h-4" /> Generate Copy</>
              )}
            </button>

            {/* Tone legend */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tone Variants</p>
              <ul className="space-y-2">
                {TONE_PRESETS.map((t) => (
                  <li key={t.id} className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{t.label}:</span> {t.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {!result && !loading && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center h-full flex flex-col items-center justify-center">
              <PenLine className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium mb-1">Ready to write</p>
              <p className="text-gray-400 text-sm">Select a product and click Generate Copy to get 3 tone variants, a full Etsy description, email teaser, and social caption.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center h-full flex flex-col items-center justify-center">
              <RefreshCw className="w-10 h-10 text-violet-400 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Writing your copy...</p>
              <p className="text-gray-400 text-sm mt-1">Crafting 3 tone variants + Etsy description + social content</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  { id: 'variants', label: 'Copy Variants', icon: <PenLine className="w-3.5 h-3.5" /> },
                  { id: 'etsy', label: 'Etsy Listing', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                  { id: 'email', label: 'Email Teaser', icon: <Mail className="w-3.5 h-3.5" /> },
                  { id: 'social', label: 'Social Caption', icon: <Share2 className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'variants' && (
                <div className="space-y-3">
                  {result.variants.map((variant, i) => (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      active={activeVariant === i}
                      onSelect={() => setActiveVariant(i)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'etsy' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 border border-orange-100 rounded-lg px-4 py-2.5">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <p>Ready to paste directly into your Etsy listing description field.</p>
                  </div>
                  <CopyBlock label="Etsy Listing Description" content={result.etsyDescription} />
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <p>Use as your email preview text or opening paragraph.</p>
                  </div>
                  <CopyBlock label="Email Teaser" content={result.emailTeaser} />
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-pink-50 border border-pink-100 rounded-lg px-4 py-2.5">
                    <Share2 className="w-4 h-4 text-pink-500" />
                    <p>Optimized for Instagram, Pinterest, and Facebook posts.</p>
                  </div>
                  <CopyBlock label="Social Media Caption" content={result.socialCaption} />
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2 border border-violet-300 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
