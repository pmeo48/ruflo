'use client'

import { useState } from 'react'
import { Sparkles, TrendingUp, Package, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const VARIANT_TIERS = [
  { tier: 'Lite', multiplier: 0.5, color: 'bg-blue-100 text-blue-700', desc: 'Entry-level version with core features' },
  { tier: 'Pro', multiplier: 1.5, color: 'bg-purple-100 text-purple-700', desc: 'Enhanced version with premium features' },
  { tier: 'Ultimate', multiplier: 2.5, color: 'bg-indigo-100 text-indigo-700', desc: 'Complete bundle with all features + bonuses' },
]

const DERIVATIVE_IDEAS = [
  'Industry-Specific Niche Edition', 'Beginner Starter Pack', 'Advanced Master Edition', 'Team Collaboration Version',
  'Done-For-You Templates Pack', 'Video Tutorial Add-on', 'Swipe File Collection', 'Email Sequence Bundle',
  'Social Proof Templates', 'Case Study Collection', 'ROI Calculator Spreadsheet', 'Project Management Board',
  'Client Onboarding Kit', 'Proposal Generator', 'Invoice & Contract Templates', 'Performance Tracker Dashboard',
  'Weekly Planning System', 'Goal Setting Framework', 'Sales Funnel Templates', 'Launch Checklist Bundle',
]

export default function ExpansionPage() {
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0])
  const [generating, setGenerating] = useState(false)
  const [derivatives, setDerivatives] = useState<string[]>([])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct.id }),
      })
      const data = await res.json()
      setDerivatives(data.ideas ?? DERIVATIVE_IDEAS)
    } catch {
      setDerivatives(DERIVATIVE_IDEAS)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <Header title="Product Expansion" subtitle="Scale your catalog with AI-powered product variations" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Card>
              <CardTitle className="mb-4">Select Base Product</CardTitle>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {MOCK_PRODUCTS.map((p) => (
                  <button key={p.id} onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedProduct.id === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-medium text-sm text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">${p.price} · {p.sales} sales</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Variants: {selectedProduct.name}</CardTitle>
                <Button size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Ideas
                </Button>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {VARIANT_TIERS.map((v) => (
                  <div key={v.tier} className="p-4 border border-gray-200 rounded-lg">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${v.color}`}>
                      <Package className="w-3 h-3" />
                      {v.tier} Edition
                    </div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      ${Math.round(selectedProduct.price * v.multiplier)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">{v.desc}</div>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      Est. ${Math.round(selectedProduct.revenue * v.multiplier * 0.3).toLocaleString()}/mo
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">Create This</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>20 Derivative Product Ideas</CardTitle>
                <Badge variant="indigo">{derivatives.length > 0 ? 'AI Generated' : 'Ready to generate'}</Badge>
              </CardHeader>
              {derivatives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {derivatives.map((idea, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-gray-700">{idea}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DERIVATIVE_IDEAS.map((idea, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-gray-600">{idea}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
