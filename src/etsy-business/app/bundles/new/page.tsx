'use client'

import { useState } from 'react'
import { ArrowLeft, Sparkles, Package, Loader2, Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'

export default function NewBundlePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bundleName, setBundleName] = useState('')
  const [bundleDesc, setBundleDesc] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const selectedProducts = MOCK_PRODUCTS.filter(p => selectedIds.includes(p.id))
  const originalPrice = selectedProducts.reduce((s, p) => s + p.price, 0)
  const suggestedPrice = Math.round(originalPrice * 0.6)
  const savings = originalPrice - suggestedPrice

  const handleGenerate = async () => {
    if (selectedIds.length < 2) return
    setGenerating(true)
    try {
      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds }),
      })
      const data = await res.json()
      if (data.name) setBundleName(data.name)
      if (data.description) setBundleDesc(data.description)
      setGenerated(true)
    } catch {
      setBundleName(`${selectedProducts.map(p => p.name.split(' ')[0]).join(' + ')} Bundle`)
      setBundleDesc(`Save ${Math.round((1 - suggestedPrice / originalPrice) * 100)}% when you buy these ${selectedProducts.length} products together.`)
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <Header
        title="New Bundle"
        subtitle="Combine products for higher order value"
        actions={
          <Link href="/bundles"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
        }
      />
      <div className="p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardTitle className="mb-4">1. Select Products ({selectedIds.length} selected)</CardTitle>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {MOCK_PRODUCTS.filter(p => p.type !== 'bundle').map((p) => {
                  const isSelected = selectedIds.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => toggleProduct(p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">${p.price}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedIds.length >= 2 && (
              <Card>
                <CardTitle className="mb-4">Bundle Pricing</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original value</span>
                    <span className="text-gray-400 line-through">${originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Suggested price</span>
                    <span className="text-2xl font-bold text-gray-900">${suggestedPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer saves</span>
                    <Badge variant="green">${savings} ({Math.round(savings / originalPrice * 100)}% off)</Badge>
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full mt-4">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Bundle Name & Description</>}
                </Button>
              </Card>
            )}

            {generated && (
              <Card>
                <CardTitle className="mb-4">2. Bundle Details</CardTitle>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
                    <Input value={bundleName} onChange={(e) => setBundleName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={4} value={bundleDesc} onChange={(e) => setBundleDesc(e.target.value)} />
                  </div>
                  <Button className="w-full"><Package className="w-4 h-4" />Create Bundle</Button>
                </div>
              </Card>
            )}

            {selectedIds.length < 2 && (
              <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                Select at least 2 products to create a bundle
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
