import { Package, Plus, Search, Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'

const TYPE_COLORS: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'indigo'> = {
  pdf: 'blue',
  spreadsheet: 'green',
  notion: 'purple',
  'prompt-pack': 'yellow',
  bundle: 'indigo',
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Guide',
  spreadsheet: 'Spreadsheet',
  notion: 'Notion Template',
  'prompt-pack': 'Prompt Pack',
  bundle: 'Bundle',
}

const STATUS_COLORS: Record<string, 'green' | 'gray' | 'yellow' | 'red'> = {
  active: 'green',
  draft: 'gray',
  paused: 'yellow',
  archived: 'red',
}

export default function ProductsPage() {
  return (
    <div>
      <Header
        title="Products"
        subtitle={`${MOCK_PRODUCTS.length} products · ${MOCK_PRODUCTS.filter(p => p.status === 'active').length} active listings`}
        actions={
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Product
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search products..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Conv.</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.map((product) => (
                <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <Link href={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={TYPE_COLORS[product.type]}>{TYPE_LABELS[product.type]}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={STATUS_COLORS[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    ${product.price}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600">
                    {formatNumber(product.sales)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-xs font-medium ${product.conversionRate > 0.8 ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.conversionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {product.avgRating && (
                      <span className="text-xs text-gray-600">⭐ {product.avgRating}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/products/${product.id}`} className="text-indigo-600 hover:text-indigo-700 text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
