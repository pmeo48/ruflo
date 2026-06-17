import { Search, TrendingUp, Tag, BarChart2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS, MOCK_KEYWORDS } from '@/lib/mock-data'
import Link from 'next/link'

export default function SEOPage() {
  return (
    <div>
      <Header title="SEO Engine" subtitle="Optimize your Etsy listings for maximum visibility" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg SEO Score', value: '82/100', icon: BarChart2, color: 'bg-green-100 text-green-700' },
            { label: 'Keywords Tracked', value: MOCK_KEYWORDS.length.toString(), icon: Search, color: 'bg-blue-100 text-blue-700' },
            { label: 'Top Tag', value: 'AI prompts', icon: Tag, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Trend', value: 'Rising ↑', icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Product SEO Scores</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tags</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PRODUCTS.map((product, i) => {
                    const score = [88, 92, 76, 95, 83, 79, 91, 68, 87, 94][i] ?? 80
                    return (
                      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link href={`/seo/${product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 text-sm">{product.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-sm ${score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{score}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs ${product.tags.length >= 13 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>{product.tags.length}/13</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={score >= 85 ? 'green' : score >= 70 ? 'yellow' : 'red'}>
                            {score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Work'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/seo/${product.id}`} className="text-indigo-600 text-xs hover:underline">Optimize →</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Top Performing Tags</CardTitle></CardHeader>
              <div className="space-y-3">
                {['AI prompts', 'ChatGPT templates', 'digital download', 'business templates', 'Notion template', 'prompt pack'].map((tag, i) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm text-gray-700">{tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${90 - i * 12}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{90 - i * 12}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Keyword Insights</CardTitle></CardHeader>
              <div className="space-y-2">
                {MOCK_KEYWORDS.slice(0, 4).map((kw) => (
                  <div key={kw.term} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm text-gray-900">{kw.term}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{kw.searchVolume.toLocaleString()} searches</span>
                      <Badge variant={kw.competition === 'low' ? 'green' : kw.competition === 'medium' ? 'yellow' : 'red'}>{kw.competition}</Badge>
                      <span className={`text-xs ${kw.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>{kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
