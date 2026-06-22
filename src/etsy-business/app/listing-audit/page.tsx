'use client'

import { useState } from 'react'
import { ClipboardCheck, Sparkles, AlertCircle, AlertTriangle, Lightbulb, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { ListingAuditResult, AuditFinding } from '@/lib/listing-audit'

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Warning' },
  tip: { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Tip' },
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const cfg = SEVERITY_CONFIG[finding.severity]
  const Icon = cfg.icon
  return (
    <div className={`border rounded-lg p-4 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs text-gray-500 capitalize">· {finding.category}</span>
          </div>
          <p className="text-sm text-gray-800 font-medium mb-1">{finding.issue}</p>
          <p className="text-sm text-gray-600"><span className="font-medium">Fix:</span> {finding.fix}</p>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function ListingAuditPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [price, setPrice] = useState('')
  const [photoCount, setPhotoCount] = useState('5')
  const [result, setResult] = useState<ListingAuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAllFindings, setShowAllFindings] = useState(false)

  async function runAudit() {
    if (!title && !description) { setError('Enter at least a title or description.'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/listing-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, tags, price, photoCount }),
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

  const criticalFindings = result?.findings.filter((f) => f.severity === 'critical') ?? []
  const otherFindings = result?.findings.filter((f) => f.severity !== 'critical') ?? []
  const visibleOther = showAllFindings ? otherFindings : otherFindings.slice(0, 3)

  const overallColor = result
    ? result.scores.overall >= 75 ? 'text-green-600' : result.scores.overall >= 50 ? 'text-yellow-600' : 'text-red-600'
    : 'text-gray-900'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Listing Audit</h1>
        </div>
        <p className="text-gray-600">Paste your Etsy listing details for an instant SEO and conversion scorecard.</p>
      </div>

      {/* Input form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Paste your current Etsy listing title…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/140 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400">(comma separated)</span></label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="digital planner, notion template, business template, …"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Paste your listing description…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$17.99"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Photos: <span className="text-indigo-600 font-semibold">{photoCount}</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={photoCount}
              onChange={(e) => setPhotoCount(e.target.value)}
              className="w-full mt-2 accent-indigo-600"
            />
          </div>
        </div>

        <button
          onClick={runAudit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Sparkles className="h-4 w-4 animate-pulse" /> Auditing listing…</>
          ) : (
            <><ClipboardCheck className="h-4 w-4" /> Run Listing Audit</>
          )}
        </button>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Audit Scorecard</h2>
              <div className="text-center">
                <div className={`text-4xl font-bold ${overallColor}`}>{result.scores.overall}</div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Title" score={result.scores.title} />
              <ScoreBar label="Tags" score={result.scores.tags} />
              <ScoreBar label="Description" score={result.scores.description} />
              <ScoreBar label="Pricing" score={result.scores.pricing} />
              <ScoreBar label="Photos" score={result.scores.photos} />
            </div>
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{result.summary}</p>
          </div>

          {/* Optimized title */}
          {result.optimizedTitle && result.optimizedTitle !== title && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Optimized Title</h2>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                <p className="text-sm text-indigo-900 flex-1">{result.optimizedTitle}</p>
                <CopyButton text={result.optimizedTitle} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{result.optimizedTitle.length}/140 characters</p>
            </div>
          )}

          {/* Suggested tags */}
          {result.suggestedTags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Suggested Tags ({result.suggestedTags.length}/13)</h2>
                <CopyButton text={result.suggestedTags.join(', ')} />
              </div>
              <div className="flex flex-wrap gap-2">
                {result.suggestedTags.map((tag) => (
                  <span key={tag} className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {(criticalFindings.length > 0 || otherFindings.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Findings <span className="text-sm font-normal text-gray-500">({result.findings.length} total)</span>
              </h2>

              {criticalFindings.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">Critical — Fix First</p>
                  <div className="space-y-3">
                    {criticalFindings.map((f, i) => <FindingCard key={i} finding={f} />)}
                  </div>
                </div>
              )}

              {otherFindings.length > 0 && (
                <div>
                  {criticalFindings.length > 0 && <div className="border-t border-gray-100 my-4" />}
                  <div className="space-y-3">
                    {visibleOther.map((f, i) => <FindingCard key={i} finding={f} />)}
                  </div>
                  {otherFindings.length > 3 && (
                    <button
                      onClick={() => setShowAllFindings(!showAllFindings)}
                      className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {showAllFindings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {showAllFindings ? 'Show less' : `Show ${otherFindings.length - 3} more`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-14 text-gray-400">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">Ready to audit</p>
          <p className="text-sm mt-1">Paste your listing details above and click Run Listing Audit.</p>
        </div>
      )}
    </div>
  )
}
