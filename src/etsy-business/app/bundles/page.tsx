'use client'

import { useState } from 'react'
import { Layers, Plus, TrendingUp, DollarSign } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_BUNDLES, MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/analytics'
import Link from 'next/link'

export default function BundlesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const selectedTotal = MOCK_PRODUCTS
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0)
  const suggestedBundlePrice = Math.round(selectedTotal * 0.6)

  return (
    <div>
      <Header
        title="Bundle Manager"
        subtitle="Create product bundles with AI-powered pricing recommendations"
        actions={
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4" />
            Create Bundle
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Existing Bundles */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Active Bundles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MOCK_BUNDLES.map(bundle => (
              <Card key={bundle.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                  <Badge variant={bundle.status === 'active' ? 'green' : 'gray'}>{bundle.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">{bundle.description}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-indigo-600">${bundle.price}</p>
                    <p className="text-xs text-gray-500">Bundle Price</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-400 line-through">${bundle.originalPrice}</p>
                    <p className="text-xs text-gray-500">Original</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">${bundle.savings}</p>
                    <p className="text-xs text-green-600">Savings</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{bundle.productIds.length} products · {bundle.sales} sales</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(bundle.revenue)} revenue</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bundle Creator */}
        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Bundle</CardTitle>
              <Badge variant="blue">AI Pricing Active</Badge>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selector */}
              <div className="lg:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Products to Bundle</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {MOCK_PRODUCTS.map(product => (
                    <label key={product.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedProducts.includes(product.id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">${product.price}</p>
                      </div>
                      <span className="text-xs text-gray-400">{product.type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing Panel */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Pricing Recommendation</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Products selected</span>
                      <span className="font-medium">{selectedProducts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total value</span>
                      <span className="font-medium">${selectedTotal}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                      <span className="text-gray-600">Suggested price</span>
                      <span className="font-bold text-indigo-600">${suggestedBundlePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Buyer saves</span>
                      <span className="font-medium text-green-600">{selectedTotal > 0 ? Math.round(((selectedTotal - suggestedBundlePrice) / selectedTotal) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full" disabled={selectedProducts.length < 2}>
                  <Layers className="w-4 h-4" />
                  Create Bundle
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
