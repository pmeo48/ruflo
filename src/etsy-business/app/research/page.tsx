import { Search, TrendingUp, DollarSign, Users, ChevronUp, ChevronDown } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_KEYWORDS } from '@/lib/mock-data'

const COMPETITORS = [
  { shop: 'AIPromptsShop', product: 'ChatGPT Business Prompts Pack 500+', price: 24, sales: 2840, rating: 4.9, tags: ['ChatGPT', 'AI prompts', 'business'], opportunity: 'high' as const },
  { shop: 'DigitalTemplateHub', product: 'Notion Business OS Template', price: 39, sales: 1920, rating: 4.8, tags: ['Notion', 'business template', 'productivity'], opportunity: 'medium' as const },
  { shop: 'ContentCreatorTools', product: 'AI Social Media Content Pack', price: 17, sales: 4200, rating: 4.7, tags: ['social media', 'content creation', 'AI'], opportunity: 'high' as const },
  { shop: 'EntrepreneurVault', product: 'AI Agency Starter Bundle', price: 67, sales: 890, rating: 4.9, tags: ['AI agency', 'freelance', 'business'], opportunity: 'medium' as const },
  { shop: 'FreelanceToolkit', product: 'Freelancer Client Templates Pack', price: 29, sales: 1560, rating: 4.6, tags: ['freelance', 'client templates', 'contracts'], opportunity: 'low' as const },
]

const RECOMMENDATIONS = [
  'AI prompts market is growing 34% MoM — strong opportunity for prompt packs under $30',
  'Notion templates priced $40-60 outperform lower-priced alternatives by 2.3x in revenue',
  'Business bundles with 5+ products see 47% higher conversion than single products',
  'Top sellers use all 13 Etsy tags with high-volume keywords in first 3 positions',
  'Digital downloads with mockup images convert 38% better than text-only listings',
]

export default function ResearchPage() {
  return (
    <div>
      <Header title="Market Research" subtitle="Competitor analysis and market positioning" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Market Size', value: '$2.4M/mo', icon: DollarSign, color: 'bg-green-100 text-green-700' },
            { label: 'Competitors', value: '340+', icon: Users, color: 'bg-blue-100 text-blue-700' },
            { label: 'Avg Price', value: '$34.20', icon: Search, color: 'bg-purple-100 text-purple-700' },
            { label: 'Growth', value: '+34% MoM', icon: TrendingUp, color: 'bg-yellow-100 text-yellow-700' },
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

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Competitor Analysis</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{c.shop}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <div className="truncate">{c.product}</div>
                    <div className="flex gap-1 mt-1">
                      {c.tags.slice(0, 2).map((t) => <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{t}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${c.price}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.sales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-500">&#9733;</span> {c.rating}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={c.opportunity === 'high' ? 'green' : c.opportunity === 'medium' ? 'yellow' : 'gray'}>{c.opportunity}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>AI Recommendations</CardTitle></CardHeader>
            <ul className="space-y-3 mt-2">
              {RECOMMENDATIONS.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader><CardTitle>Keyword Volume Analysis</CardTitle></CardHeader>
            <div className="space-y-3 mt-2">
              {MOCK_KEYWORDS.map((kw) => (
                <div key={kw.term} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{kw.term}</div>
                    <div className="text-xs text-gray-400">{kw.searchVolume.toLocaleString()} searches/mo</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={kw.competition === 'low' ? 'green' : kw.competition === 'medium' ? 'yellow' : 'red'}>{kw.competition}</Badge>
                    {kw.trend === 'up' ? <ChevronUp className="w-4 h-4 text-green-500" /> : <ChevronDown className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
