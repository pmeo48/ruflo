'use client'

import { useState } from 'react'
import { Sparkles, FileText, Table2, Layout, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

const PRODUCT_TYPES = [
  { id: 'pdf', label: 'PDF Guide', icon: FileText, description: 'Ebooks, guides, how-to PDFs', color: 'bg-blue-100 text-blue-700' },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: Table2, description: 'Excel & Google Sheets templates', color: 'bg-green-100 text-green-700' },
  { id: 'notion', label: 'Notion Template', icon: Layout, description: 'Complete Notion workspace templates', color: 'bg-purple-100 text-purple-700' },
  { id: 'prompt-pack', label: 'Prompt Pack', icon: MessageSquare, description: 'AI prompt collections & packs', color: 'bg-yellow-100 text-yellow-700' },
]

interface GeneratedProduct {
  name: string
  description: string
  contents: string[]
  chapters: string[]
  tags: string[]
  price: number
  salesCopy: string
}

export default function NewProductPage() {
  const [selectedType, setSelectedType] = useState('')
  const [niche, setNiche] = useState('')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedProduct | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!selectedType || !niche) { setError('Please select a product type and enter a niche.'); return }
    setError('')
    setGenerating(true)
    try {
      const res = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: selectedType, niche, title }),
      })
      const data = await res.json()
      setGenerated(data)
    } catch { setError('Generation failed. Please try again.') }
    finally { setGenerating(false) }
  }

  return (
    <div>
      <Header
        title="New Product"
        subtitle="AI-powered product builder"
        actions={
          <Link href="/products">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4" />Back</Button>
          </Link>
        }
      />
      <div className="p-6 max-w-4xl">
        <Card className="mb-6">
          <CardTitle className="mb-4">1. Choose Product Type</CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRODUCT_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button key={type.id} onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${selectedType === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${type.color}`}><Icon className="w-5 h-5" /></div>
                  <div className="font-medium text-sm text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="mb-6">
          <CardTitle className="mb-4">2. Product Details</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Target Market *</label>
              <Input placeholder="e.g., real estate agents, fitness coaches, freelance designers..." value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title (optional)</label>
              <Input placeholder="Leave blank to auto-generate..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="mt-4">
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating with AI...</> : <><Sparkles className="w-4 h-4" />Generate Product with AI</>}
            </Button>
          </div>
        </Card>

        {generated && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>AI-Generated Preview</CardTitle>
              <Badge variant="green">Ready to publish</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Product Name</div>
                <div className="text-lg font-bold text-gray-900">{generated.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Description</div>
                <p className="text-sm text-gray-700">{generated.description}</p>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Sales Copy</div>
                <p className="text-sm text-indigo-700 font-medium italic">"{generated.salesCopy}"</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-medium mb-2">Contents</div>
                  <ul className="space-y-1">
                    {generated.contents.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
                {generated.chapters.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">Chapters</div>
                    <ol className="space-y-1">
                      {generated.chapters.map((c, i) => <li key={i} className="text-sm text-gray-600">{i + 1}. {c}</li>)}
                    </ol>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {generated.tags.map((tag, i) => <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>)}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">Suggested Price</div>
                  <div className="text-2xl font-bold text-gray-900">${generated.price}</div>
                </div>
                <Button>Create Product &rarr;</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
