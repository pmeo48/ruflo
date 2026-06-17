'use client'

import { useState } from 'react'
import { ArrowLeft, Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS, MOCK_KEYWORDS } from '@/lib/mock-data'
import Link from 'next/link'

interface Props { params: { productId: string } }

export default function ProductSEOPage({ params }: Props) {
  const product = MOCK_PRODUCTS.find((p) => p.id === params.productId) ?? MOCK_PRODUCTS[0]
  const [optimizedTitle, setOptimizedTitle] = useState(product.name)
  const [optimizedTags, setOptimizedTags] = useState<string[]>(product.tags)
  const [optimizedDesc, setOptimizedDesc] = useState(product.description)
  const [generating, setGenerating] = useState(false)
  const [copiedTags, setCopiedTags] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, productName: product.name, productType: product.type }),
      })
      const data = await res.json()
      if (data.title) setOptimizedTitle(data.title)
      if (data.tags) setOptimizedTags(data.tags)
      if (data.description) setOptimizedDesc(data.description)
    } catch { /* keep existing */ }
    finally { setGenerating(false) }
  }

  const copyTags = () => {
    navigator.clipboard.writeText(optimizedTags.join(', '))
    setCopiedTags(true)
    setTimeout(() => setCopiedTags(false), 2000)
  }

  const seoScore = 87
  const titleLen = optimizedTitle.length

  return (
    <div>
      <Header
        title={`SEO: ${product.name}`}
        subtitle="Optimize for Etsy search visibility"
        actions={
          <div className="flex gap-2">
            <Link href="/seo"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Optimizing...' : 'AI Optimize'}
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Listing Title</CardTitle>
                <span className={`text-xs ${titleLen > 140 ? 'text-red-600' : titleLen > 120 ? 'text-yellow-600' : 'text-gray-400'}`}>{titleLen}/140</span>
              </CardHeader>
              <textarea className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} value={optimizedTitle} onChange={(e) => setOptimizedTitle(e.target.value)} />
              <p className="text-xs text-gray-400 mt-2">Include primary keywords near the start. Max 140 characters.</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags ({optimizedTags.length}/13)</CardTitle>
                <button onClick={copyTags} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  {copiedTags ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedTags ? 'Copied!' : 'Copy all'}
                </button>
              </CardHeader>
              <div className="flex flex-wrap gap-2 mb-3">
                {optimizedTags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">
                    {tag}
                    <button onClick={() => setOptimizedTags(optimizedTags.filter((_, idx) => idx !== i))} className="text-indigo-400 hover:text-red-500 ml-1">x</button>
                  </div>
                ))}
                {optimizedTags.length < 13 && (
                  <button className="px-2 py-1 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                    onClick={() => { const tag = prompt('Add tag:'); if (tag) setOptimizedTags([...optimizedTags, tag]) }}>
                    + Add tag
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">Etsy allows exactly 13 tags. Use all 13 for maximum reach.</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <span className="text-xs text-gray-400">{optimizedDesc.length} chars</span>
              </CardHeader>
              <textarea className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={8} value={optimizedDesc} onChange={(e) => setOptimizedDesc(e.target.value)} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardTitle className="mb-4">SEO Score</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${seoScore}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-gray-900">{seoScore}</span></div>
                </div>
                <div>
                  <div className="text-green-600 font-semibold">Excellent</div>
                  <div className="text-xs text-gray-500 mt-1">Above average</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Title keywords', ok: true },
                  { label: 'All 13 tags used', ok: optimizedTags.length >= 13 },
                  { label: 'Description length', ok: optimizedDesc.length > 200 },
                  { label: 'Category set', ok: true },
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    <span className={check.ok ? 'text-green-500' : 'text-red-400'}>{check.ok ? 'v' : 'x'}</span>
                    <span className={check.ok ? 'text-gray-700' : 'text-gray-400'}>{check.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-3">Keyword Research</CardTitle>
              <div className="space-y-2">
                {MOCK_KEYWORDS.map((kw) => (
                  <div key={kw.term} className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => { if (optimizedTags.length < 13) setOptimizedTags([...optimizedTags, kw.term]) }}>
                    <div className="text-xs font-medium text-gray-800">{kw.term}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{kw.searchVolume.toLocaleString()}/mo</span>
                      <Badge variant={kw.competition === 'low' ? 'green' : kw.competition === 'medium' ? 'yellow' : 'red'}>{kw.competition}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button className="w-full">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
