'use client'

import { useState } from 'react'
import { HelpCircle, Sparkles, Copy, Check, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import type { FAQ, FAQResult } from '@/lib/faq'
import { CATEGORY_LABELS } from '@/lib/faq'

const CATEGORY_COLORS: Record<string, string> = {
  delivery: 'bg-blue-50 text-blue-700 border-blue-200',
  usage: 'bg-green-50 text-green-700 border-green-200',
  technical: 'bg-purple-50 text-purple-700 border-purple-200',
  refunds: 'bg-red-50 text-red-700 border-red-200',
  customization: 'bg-amber-50 text-amber-700 border-amber-200',
  general: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PRODUCT_EXAMPLES = [
  { name: 'AI Business Planner', desc: 'A 50-page PDF business planning workbook with goal-setting templates, financial projections, and weekly review sheets. Instant digital download.' },
  { name: 'Notion CRM Template', desc: 'A complete client management system built in Notion. Includes pipeline tracking, invoice logging, follow-up reminders, and onboarding checklists.' },
  { name: 'Social Media Content Calendar', desc: '180-day pre-planned content calendar for Instagram, TikTok, and Pinterest. Includes daily post ideas, caption frameworks, and hashtag clusters.' },
]

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function FAQCard({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(index < 3)
  const catColor = CATEGORY_COLORS[faq.category] ?? CATEGORY_COLORS.general

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <HelpCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 text-sm">{faq.question}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${catColor}`}>
              {CATEGORY_LABELS[faq.category]}
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-start justify-between gap-3 mt-3">
            <p className="text-sm text-gray-700 flex-1">{faq.answer}</p>
            <CopyBtn text={`Q: ${faq.question}\nA: ${faq.answer}`} label="Copy Q&A" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<FAQResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBlock, setShowBlock] = useState(false)

  async function generate() {
    if (!productName.trim() && !description.trim()) {
      setError('Enter a product name or description.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, description }),
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

  function loadExample(ex: typeof PRODUCT_EXAMPLES[0]) {
    setProductName(ex.name)
    setDescription(ex.desc)
    setResult(null)
  }

  // Group FAQs by category for the formatted view
  const grouped = result
    ? result.faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = []
        acc[faq.category].push(faq)
        return acc
      }, {})
    : {}

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Generator</h1>
        </div>
        <p className="text-gray-600">Generate buyer-ready FAQs for any digital product listing. Paste directly into your Etsy description to reduce support messages and boost conversions.</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. AI Business Planner PDF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Description <span className="text-gray-400 font-normal">(optional — more detail = better FAQs)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what the product contains, who it's for, what format it's in…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Generating FAQs…' : 'Generate FAQs'}
          </button>
          {result && <CopyBtn text={result.formattedBlock} label="Copy all as listing block" />}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                onClick={() => loadExample(ex)}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{result.faqs.length} FAQs generated across {Object.keys(grouped).length} categories</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBlock(!showBlock)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <ClipboardList className="h-4 w-4" />
                {showBlock ? 'Hide' : 'Show'} formatted block
              </button>
            </div>
          </div>

          {/* Formatted block (paste-ready) */}
          {showBlock && (
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-medium">READY TO PASTE INTO ETSY DESCRIPTION</p>
                <CopyBtn text={result.formattedBlock} label="Copy all" />
              </div>
              <pre className="text-xs text-green-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-80">
                {result.formattedBlock}
              </pre>
            </div>
          )}

          {/* Category tabs */}
          <div className="space-y-3">
            {Object.entries(grouped).map(([cat, faqs]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                  {CATEGORY_LABELS[cat as FAQ['category']]} ({faqs.length})
                </p>
                <div className="space-y-2">
                  {faqs.map((faq, i) => (
                    <FAQCard key={i} faq={faq} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Regenerate */}
          <button
            onClick={generate}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2"
          >
            <Sparkles className="h-4 w-4" /> Regenerate with different variations
          </button>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-14 text-gray-400">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">No FAQs yet</p>
          <p className="text-sm mt-1">Enter your product name above and click Generate.</p>
        </div>
      )}
    </div>
  )
}
