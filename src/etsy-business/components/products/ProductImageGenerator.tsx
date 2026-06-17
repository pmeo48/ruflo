'use client'

import { useState } from 'react'
import { ImageIcon, Loader2, Download, RefreshCw } from 'lucide-react'

interface Props {
  productName: string
  productType: string
  niche: string
}

type ImageStyle = 'cover' | 'mockup' | 'social'

export function ProductImageGenerator({ productName, productType, niche }: Props) {
  const [images, setImages] = useState<Record<ImageStyle, string | null>>({
    cover: null, mockup: null, social: null
  })
  const [loading, setLoading] = useState<ImageStyle | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async (style: ImageStyle) => {
    if (!productName) {
      setError('Enter a product name first')
      return
    }
    setLoading(style)
    setError(null)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productType, niche, style })
      })
      const data = await res.json()
      if (data.url) {
        setImages(prev => ({ ...prev, [style]: data.url }))
      } else if (data.placeholder) {
        setError('Add OPENAI_API_KEY to .env.local to enable image generation')
      } else {
        setError(data.error ?? 'Generation failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  const styles: { key: ImageStyle; label: string; description: string }[] = [
    { key: 'cover', label: 'Product Cover', description: 'Main listing image' },
    { key: 'mockup', label: 'Device Mockup', description: 'MacBook + iPad display' },
    { key: 'social', label: 'Social/Pinterest', description: 'Optimized for pins' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">AI Image Generator</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">DALL-E 3</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {styles.map(({ key, label, description }) => (
          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
            {images[key] ? (
              <div className="relative">
                <img src={images[key]!} alt={label} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => generate(key)}
                    className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-purple-600"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <a
                    href={images[key]!}
                    download={`${productName}-${key}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-purple-600"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gray-50 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400">{description}</span>
              </div>
            )}
            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <button
                onClick={() => generate(key)}
                disabled={loading === key || !productName}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === key ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                ) : (
                  <><ImageIcon className="w-3.5 h-3.5" /> Generate</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
