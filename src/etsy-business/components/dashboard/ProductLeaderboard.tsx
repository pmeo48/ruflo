import { TrendingUp, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Product } from '@/lib/types'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'

interface ProductLeaderboardProps {
  products: Product[]
}

const TYPE_BADGES: Record<string, { label: string; variant: 'green' | 'blue' | 'purple' | 'yellow' | 'indigo' }> = {
  pdf: { label: 'PDF', variant: 'blue' },
  spreadsheet: { label: 'Sheet', variant: 'green' },
  notion: { label: 'Notion', variant: 'purple' },
  'prompt-pack': { label: 'Prompts', variant: 'yellow' },
  bundle: { label: 'Bundle', variant: 'indigo' },
}

export function ProductLeaderboard({ products }: ProductLeaderboardProps) {
  const sorted = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Leaderboard</CardTitle>
        <Link href="/products" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          View all
        </Link>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">#</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Product</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Type</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3 pr-4">Revenue</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3 pr-4">Sales</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, i) => {
              const badge = TYPE_BADGES[product.type]
              return (
                <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 text-gray-400 font-medium">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <Link href={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      <span className="text-xs text-gray-400">${product.price}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600">
                    {formatNumber(product.sales)}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-xs font-medium ${product.conversionRate > 0.8 ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.conversionRate}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
