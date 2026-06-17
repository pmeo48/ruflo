import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Star, Eye, Heart, ShoppingBag, Tag, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'

const TYPE_COLORS: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'indigo'> = {
  pdf: 'blue', spreadsheet: 'green', notion: 'purple', 'prompt-pack': 'yellow', bundle: 'indigo',
}
const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Guide', spreadsheet: 'Spreadsheet', notion: 'Notion Template', 'prompt-pack': 'Prompt Pack', bundle: 'Bundle',
}

interface Props { params: { id: string } }

export default function ProductDetailPage({ params }: Props) {
  const product = MOCK_PRODUCTS.find((p) => p.id === params.id)
  if (!product) notFound()
  const seoScore = [88, 92, 76, 95, 83, 79, 91, 68, 87, 94][parseInt(product.id) - 1] ?? 80

  return (
    <div>
      <Header
        title={product.name}
        subtitle={`Created ${new Date(product.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/products"><Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
            {product.etsyListingUrl && (
              <a href={product.etsyListingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm"><ExternalLink className="w-4 h-4" />Etsy</Button>
              </a>
            )}
            <Link href={`/seo/${product.id}`}><Button size="sm">Optimize SEO</Button></Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: formatCurrency(product.revenue), icon: TrendingUp, color: 'text-green-600' },
            { label: 'Sales', value: formatNumber(product.sales), icon: ShoppingBag, color: 'text-indigo-600' },
            { label: 'Views', value: formatNumber(product.views), icon: Eye, color: 'text-blue-600' },
            { label: 'Favorites', value: formatNumber(product.favorites), icon: Heart, color: 'text-red-500' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gray-100 rounded-lg ${stat.color}`}><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={TYPE_COLORS[product.type]}>{TYPE_LABELS[product.type]}</Badge>
                  <Badge variant={product.status === 'active' ? 'green' : 'gray'}>{product.status}</Badge>
                </div>
              </CardHeader>
              <p className="text-sm text-gray-700 mb-4">{product.description}</p>
              {product.salesCopy && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xs text-indigo-600 font-medium mb-1">Sales Copy</div>
                  <p className="text-sm text-indigo-800 italic">"{product.salesCopy}"</p>
                </div>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-4">Contents</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {product.contents.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            {product.chapters && product.chapters.length > 0 && (
              <Card>
                <CardTitle className="mb-4">Chapters / Sections</CardTitle>
                <ol className="space-y-2">
                  {product.chapters.map((chapter, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-indigo-600 font-bold mt-0.5">{i + 1}.</span>
                      <span className="text-gray-700">{chapter}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardTitle className="mb-4">Pricing</CardTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Price</span>
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                </div>
                {product.compareAtPrice && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Compare at</span>
                      <span className="text-sm text-gray-400 line-through">${product.compareAtPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Savings</span>
                      <Badge variant="green">{Math.round((1 - product.price / product.compareAtPrice) * 100)}% off</Badge>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Conversion</span>
                  <span className="text-sm font-medium text-gray-900">{product.conversionRate}%</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Score</CardTitle>
                <Link href={`/seo/${product.id}`} className="text-xs text-indigo-600 hover:underline">Optimize →</Link>
              </CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={seoScore >= 80 ? '#22c55e' : '#f59e0b'} strokeWidth="3" strokeDasharray={`${seoScore}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{seoScore}</span>
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-medium ${seoScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {seoScore >= 80 ? 'Excellent' : 'Good'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{product.tags.length}/13 tags</div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><div className="flex items-center gap-2"><Tag className="w-4 h-4" />Tags</div></CardTitle>
                <span className="text-xs text-gray-400">{product.tags.length}/13</span>
              </CardHeader>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>
                ))}
              </div>
            </Card>

            {product.avgRating && (
              <Card>
                <CardTitle className="mb-3">Ratings</CardTitle>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-gray-900">{product.avgRating}</span>
                  <span className="text-sm text-gray-500">({product.reviewCount})</span>
                </div>
              </Card>
            )}

            <Card>
              <CardTitle className="mb-3">Expansion Options</CardTitle>
              <div className="space-y-2">
                {['Lite Edition', 'Pro Edition', 'Ultimate Bundle'].map((variant) => (
                  <div key={variant} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{variant}</span>
                    <Badge variant="gray">Suggested</Badge>
                  </div>
                ))}
              </div>
              <Link href="/expansion"><Button variant="secondary" size="sm" className="w-full mt-3">View Expansions →</Button></Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
