import { Search, TrendingUp, Tag, FileText, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS, MOCK_KEYWORDS } from '@/lib/mock-data'
import { ETSY_SEO_CONSTRAINTS } from '@/lib/seo'
import Link from 'next/link'

export default function SEOPage() {
  return (
    <div>
      <Header
        title="SEO Engine"
        subtitle="Optimize your listings for maximum Etsy search visibility"
      />

      <div className="p-6 space-y-6">
        {/* Keyword Database */}
        <Card>
          <CardHeader>
            <CardTitle>Keyword Research Database</CardTitle>
            <Badge variant="blue">{MOCK_KEYWORDS.length} keywords tracked</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Keyword</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Volume</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Competition</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Relevance</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_KEYWORDS.map((kw) => (
                  <tr key={kw.term} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{kw.term}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{kw.searchVolume.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={kw.competition === 'low' ? 'green' : kw.competition === 'medium' ? 'yellow' : 'red'}>
                        {kw.competition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${kw.relevanceScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{kw.relevanceScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={kw.trend === 'up' ? 'text-green-600' : kw.trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                        {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Products SEO Status */}
        <Card>
          <CardHeader>
            <CardTitle>Product SEO Status</CardTitle>
            <Link href="/products/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Optimize All →
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {MOCK_PRODUCTS.map((product) => {
              const titleLength = product.name.length
              const tagCount = product.tags.length
              const seoScore = Math.min(100, Math.round(
                (Math.min(titleLength, 140) / 140) * 40 +
                (tagCount / 13) * 40 +
                (product.description ? 20 : 0)
              ))

              return (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Title: {titleLength} chars · Tags: {tagCount}/13
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${seoScore >= 80 ? 'bg-green-500' : seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${seoScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{seoScore}</span>
                    </div>
                    <Link href={`/seo/${product.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
                      Optimize →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
