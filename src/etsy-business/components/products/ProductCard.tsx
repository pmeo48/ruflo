import { Star, Eye, Heart, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Product } from '@/lib/types'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'

const TYPE_COLORS: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'indigo'> = {
  pdf: 'blue', spreadsheet: 'green', notion: 'purple', 'prompt-pack': 'yellow', bundle: 'indigo',
}
const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Guide', spreadsheet: 'Spreadsheet', notion: 'Notion', 'prompt-pack': 'Prompt Pack', bundle: 'Bundle',
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card hover className="flex flex-col">
      <div className="w-full h-36 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        <div className="text-white text-center p-4">
          <div className="text-4xl mb-1">
            {product.type === 'pdf' ? '📄' : product.type === 'spreadsheet' ? '📊' : product.type === 'notion' ? '📋' : product.type === 'prompt-pack' ? '✨' : '📦'}
          </div>
          <div className="text-xs font-medium opacity-80 line-clamp-2">{product.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={TYPE_COLORS[product.type]}>{TYPE_LABELS[product.type]}</Badge>
        <Badge variant={product.status === 'active' ? 'green' : 'gray'}>{product.status}</Badge>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</h3>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(product.views)}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(product.favorites)}</span>
        {product.avgRating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{product.avgRating}</span>}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold text-gray-900">${product.price}</div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />{formatCurrency(product.revenue)}
          </div>
          <div className="text-xs text-gray-400">{product.sales} sales</div>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Link href={`/products/${product.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">View</Button>
        </Link>
        <Link href={`/seo/${product.id}`} className="flex-1">
          <Button size="sm" className="w-full">SEO</Button>
        </Link>
      </div>
    </Card>
  )
}
