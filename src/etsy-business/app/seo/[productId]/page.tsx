'use client'

import { useState } from 'react'
import { Sparkles, ArrowLeft, Copy, Check, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { ETSY_SEO_CONSTRAINTS } from '@/lib/seo'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function ProductSEOPage({ params }: { params: { productId: string } }) {
  const product = MOCK_PRODUCTS.find(p => p.id === params.productId)
  if (!product) notFound()

  const [isGenerating, setIsGenerating] = useState(false)
  const [seoData, setSeoData] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productDescription: product.description,
          productType: product.type,
        }),
      })
      const data = await response.json()
      setSeoData(data)
    } catch (error) {
      console.error('SEO generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const currentTitle = seoData?.title || product.name
  const titleLength = currentTitle.length

  return (
    <div>
      <Header
        title="SEO Optimizer"
        subtitle={product.name}
        actions={
          <div className="flex gap-2">
            <Link href="/seo">
              <Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" />Back</Button>
            </Link>
            <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>
              <Sparkles className="w-4 h-4" />
              {seoData ? 'Regenerate' : 'Generate SEO'}
            </Button>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Title</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${titleLength > ETSY_SEO_CONSTRAINTS.maxTitleLength ? 'text-red-600' : titleLength > 100 ? 'text-green-600' : 'text-gray-500'}`}>
                  {titleLength}/{ETSY_SEO_CONSTRAINTS.maxTitleLength}
                </span>
                <button onClick={() => handleCopy(currentTitle, 'title')} className="p-1 hover:bg-gray-100 rounded">
                  {copiedField === 'title' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </CardHeader>
            <p className="text-gray-900 font-medium">{currentTitle}</p>
            {titleLength > ETSY_SEO_CONSTRAINTS.maxTitleLength && (
              <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Title exceeds 140 character limit
              </div>
            )}
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags ({(seoData?.tags || product.tags).length}/{ETSY_SEO_CONSTRAINTS.maxTags})</CardTitle>
              <button onClick={() => handleCopy((seoData?.tags || product.tags).join(', '), 'tags')} className="p-1 hover:bg-gray-100 rounded">
                {copiedField === 'tags' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {(seoData?.tags || product.tags).map((tag: string) => (
                <span key={tag} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Description</CardTitle>
              <button onClick={() => handleCopy(seoData?.description || product.description, 'desc')} className="p-1 hover:bg-gray-100 rounded">
                {copiedField === 'desc' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </CardHeader>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {seoData?.description || product.description}
            </div>
          </Card>
        </div>

        {/* Score Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>SEO Score</CardTitle></CardHeader>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-indigo-600">{seoData?.score || 72}</div>
              <div className="text-sm text-gray-500 mt-1">out of 100</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${seoData?.score || 72}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Etsy Constraints</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Title length', current: titleLength, max: 140, unit: 'chars' },
                { label: 'Tags', current: (seoData?.tags || product.tags).length, max: 13, unit: 'tags' },
              ].map(({ label, current, max, unit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span>{current}/{max} {unit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${current > max ? 'bg-red-500' : current / max > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((current / max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
