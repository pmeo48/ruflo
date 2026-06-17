'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react'
import { Product } from '@/lib/types'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

type ImageStyle = 'cover' | 'mockup' | 'social'
type GeneratedImages = Record<string, Record<ImageStyle, string | null>>

export default function DesignPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('cover')

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(data.products ?? MOCK_PRODUCTS))
      .catch(() => setProducts(MOCK_PRODUCTS))
  }, [])

  const generateImage = async (product: Product, style: ImageStyle) => {
    const key = `${product.id}-${style}`
    setLoading(key)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          productType: product.type,
          niche: (product as Product & { niche?: string }).niche ?? 'business',
          style,
        })
      })
      const data = await res.json()
      if (data.url) {
        setGeneratedImages(prev => ({
          ...prev,
          [product.id]: { ...prev[product.id], [style]: data.url }
        }))
      }
    } finally {
      setLoading(null)
    }
  }

  const styleOptions: { value: ImageStyle; label: string }[] = [
    { value: 'cover', label: 'Product Cover' },
    { value: 'mockup', label: 'Device Mockup' },
    { value: 'social', label: 'Pinterest/Social' },
  ]

  return (
    <div>
      <Header
        title="Design Studio"
        subtitle="Generate AI product images with DALL-E 3"
      />
      <div className="p-8">
        <div className="mb-8 flex items-center justify-end">
          <div className="flex gap-2">
            {styleOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedStyle(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStyle === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const img = generatedImages[product.id]?.[selectedStyle]
            const key = `${product.id}-${selectedStyle}`
            const isLoading = loading === key
            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-50 flex items-center justify-center relative">
                  {img ? (
                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No image yet</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 mb-3 capitalize">{product.type}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateImage(product, selectedStyle)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                    {img && (
                      <a
                        href={img}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-purple-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
