import { Plus, Package, TrendingUp, DollarSign } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_BUNDLES, MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/analytics'
import Link from 'next/link'

export default function BundlesPage() {
  return (
    <div>
      <Header
        title="Bundles"
        subtitle={`${MOCK_BUNDLES.length} bundle${MOCK_BUNDLES.length !== 1 ? 's' : ''} created`}
        actions={
          <Link href="/bundles/new">
            <Button size="sm"><Plus className="w-4 h-4" />New Bundle</Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Bundle Revenue', value: formatCurrency(MOCK_BUNDLES.reduce((s, b) => s + b.revenue, 0)), icon: DollarSign },
            { label: 'Bundle Sales', value: MOCK_BUNDLES.reduce((s, b) => s + b.sales, 0).toString(), icon: TrendingUp },
            { label: 'Active Bundles', value: MOCK_BUNDLES.filter(b => b.status === 'active').length.toString(), icon: Package },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_BUNDLES.map((bundle) => {
            const products = MOCK_PRODUCTS.filter(p => bundle.productIds.includes(p.id))
            return (
              <Card key={bundle.id} hover>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{bundle.description}</p>
                  </div>
                  <Badge variant={bundle.status === 'active' ? 'green' : 'gray'}>{bundle.status}</Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Bundle Price</div>
                    <div className="text-2xl font-bold text-gray-900">${bundle.price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Original</div>
                    <div className="text-sm text-gray-400 line-through">${bundle.originalPrice}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Savings</div>
                    <div className="text-sm font-semibold text-green-600">${bundle.savings}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Included Products ({products.length})</div>
                  <div className="space-y-1">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Revenue</div>
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(bundle.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Sales</div>
                      <div className="text-sm font-semibold text-gray-900">{bundle.sales}</div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Edit Bundle</Button>
                </div>
              </Card>
            )
          })}

          <Link href="/bundles/new" className="block">
            <Card className="border-dashed border-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer h-full min-h-48">
              <div className="h-full flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Create New Bundle</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
