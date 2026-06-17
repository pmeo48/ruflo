'use client'

import { useState } from 'react'
import { GitBranch, Sparkles, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/analytics'

const EXPANSION_VARIANTS = [
  { type: 'lite', label: 'Lite', description: 'Stripped-down version at lower price', priceMultiplier: 0.4, color: 'blue' },
  { type: 'pro', label: 'Pro', description: 'Enhanced version with more features', priceMultiplier: 1.8, color: 'purple' },
  { type: 'ultimate', label: 'Ultimate', description: 'Everything included, premium price', priceMultiplier: 3.2, color: 'indigo' },
  { type: 'niche', label: 'Niche', description: 'Same product for specific industry', priceMultiplier: 1.0, color: 'green' },
]

const NICHES = ['Healthcare', 'Real Estate', 'Legal', 'Finance', 'Education', 'E-commerce', 'SaaS', 'Coaching', 'Restaurant', 'Retail']

function ProductExpansionCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsGenerating(false)
    setExpanded(true)
  }

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
            <Badge variant="green">${product.price}</Badge>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={handleGenerate} isLoading={isGenerating}>
            <Sparkles className="w-3.5 h-3.5" />
            Expand
          </Button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Expansion Opportunities (20+ variants)</h4>
          <div className="space-y-3">
            {EXPANSION_VARIANTS.map((variant) => (
              <div key={variant.type} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors">
                <Badge variant={variant.color as any}>{variant.label}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name.replace(/\s*-\s*[^-]*$/, '')} {variant.label} Edition
                  </p>
                  <p className="text-xs text-gray-500">{variant.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-indigo-600">${Math.round(product.price * variant.priceMultiplier)}</p>
                  <p className="text-xs text-gray-400">est. price</p>
                </div>
                <Button size="sm" variant="secondary">
                  <Plus className="w-3 h-3" />
                  Create
                </Button>
              </div>
            ))}

            {/* Niche Variants */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Niche Derivatives</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NICHES.slice(0, 6).map((niche) => (
                  <div key={niche} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-700 font-medium">{niche}</span>
                    <Button size="sm" variant="ghost">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function ExpansionPage() {
  const totalVariants = MOCK_PRODUCTS.length * 20
  const estRevenue = MOCK_PRODUCTS.reduce((sum, p) => sum + p.price * 8, 0)

  return (
    <div>
      <Header
        title="Product Expansion Engine"
        subtitle="Generate 20+ derivatives from each product to multiply your catalog"
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Current Products', value: MOCK_PRODUCTS.length, icon: '📦' },
            { label: 'Potential Variants', value: totalVariants, icon: '🌿' },
            { label: 'Est. Monthly Revenue', value: formatCurrency(estRevenue), icon: '💰' },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </Card>
          ))}
        </div>

        {/* Products */}
        <div className="space-y-3">
          {MOCK_PRODUCTS.map(product => (
            <ProductExpansionCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
