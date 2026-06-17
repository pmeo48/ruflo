import { ArrowLeft, ExternalLink, Edit, TrendingUp, Eye, Heart, ShoppingBag, Star } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = MOCK_PRODUCTS.find(p => p.id === params.id)
  if (!product) notFound()

  return (
    <div>
      <Header
        title={product.name}
        subtitle={`${product.type} · ${product.category}`}
        actions={
          <div className="flex gap-2">
            <Link href="/products">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            {product.etsyListingUrl && (
              <a href={product.etsyListingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="w-4 h-4" />
                  View on Etsy
                </Button>
              </a>
            )}
            <Button size="sm">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              </div>
              <Badge variant={product.status === 'active' ? 'green' : 'gray'}>{product.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-xl font-bold text-gray-900">${product.price}</p>
                {product.compareAtPrice && (
                  <p className="text-xs text-gray-400 line-through">${product.compareAtPrice}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-900">{product.category}</p>
                <p className="text-xs text-gray-500">{product.subcategory}</p>
              </div>
            </div>
          </Card>

          {/* Contents */}
          <Card>
            <CardHeader><CardTitle>What's Included</CardTitle></CardHeader>
            <ul className="grid grid-cols-2 gap-2">
              {product.contents.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader><CardTitle>Etsy Tags ({product.tags.length}/13)</CardTitle></CardHeader>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          {product.salesCopy && (
            <Card>
              <CardHeader><CardTitle>Sales Copy</CardTitle></CardHeader>
              <p className="text-sm text-gray-700 italic">"{product.salesCopy}"</p>
            </Card>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
            <div className="space-y-3">
              {[
                { icon: <TrendingUp className="w-4 h-4 text-green-500" />, label: 'Revenue', value: formatCurrency(product.revenue) },
                { icon: <ShoppingBag className="w-4 h-4 text-blue-500" />, label: 'Sales', value: formatNumber(product.sales) },
                { icon: <Eye className="w-4 h-4 text-gray-500" />, label: 'Views', value: formatNumber(product.views) },
                { icon: <Heart className="w-4 h-4 text-red-500" />, label: 'Favorites', value: formatNumber(product.favorites) },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className={`text-sm font-semibold ${product.conversionRate > 0.8 ? 'text-green-600' : 'text-gray-700'}`}>
                    {product.conversionRate}%
                  </span>
                </div>
              </div>
              {product.avgRating && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-600">Rating</span>
                  </div>
                  <span className="text-sm font-semibold">{product.avgRating} ({product.reviewCount})</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <div className="space-y-2">
              <Link href={`/seo/${product.id}`} className="block w-full text-center text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors">
                Optimize SEO
              </Link>
              <Link href="/expansion" className="block w-full text-center text-sm bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
                Generate Variations
              </Link>
              <Link href="/marketing" className="block w-full text-center text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium transition-colors">
                Create Marketing
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
