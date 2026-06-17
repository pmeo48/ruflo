'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { ProductType } from '@/lib/types'
import { ProductTypeSelector } from './ProductTypeSelector'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProductFormProps {
  onGenerate?: (data: { productType: ProductType; niche: string; title: string }) => Promise<void>
}

export function ProductForm({ onGenerate }: ProductFormProps) {
  const [productType, setProductType] = useState<ProductType | ''>('')
  const [niche, setNiche] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!productType || !niche) { setError('Please select a type and enter a niche.'); return }
    setError('')
    setLoading(true)
    try {
      await onGenerate?.({ productType: productType as ProductType, niche, title })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Product Type</h3>
        <ProductTypeSelector value={productType} onChange={setProductType} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Target Market *</label>
        <Input placeholder="e.g., real estate agents, fitness coaches..." value={niche} onChange={(e) => setNiche(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Title (optional)</label>
        <Input placeholder="Leave blank to auto-generate..." value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate with AI</>}
      </Button>
    </div>
  )
}
