import { TrendingUp, Users, DollarSign, Tag } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const MOCK_COMPETITORS = [
  { shopName: 'DigitalDownloadPro', productTitle: 'AI Business Prompt Pack - 500+ ChatGPT Prompts for Entrepreneurs', price: 24.99, sales: 4230, rating: 4.9, tags: ['ai prompts', 'chatgpt', 'business', 'entrepreneur'] },
  { shopName: 'NotionTemplateHub', productTitle: 'Ultimate Notion Business OS Template 2024', price: 47, sales: 2890, rating: 4.8, tags: ['notion template', 'business os', 'productivity', 'crm'] },
  { shopName: 'AIToolsShop', productTitle: 'Complete AI Agency Toolkit - Launch Your Agency', price: 97, sales: 1240, rating: 4.7, tags: ['ai agency', 'consulting', 'business kit'] },
  { shopName: 'SpreadsheetQueen', productTitle: 'Small Business Finance Tracker Bundle', price: 29, sales: 6700, rating: 4.9, tags: ['spreadsheet', 'finance tracker', 'small business'] },
  { shopName: 'PromptLibrary', productTitle: 'Marketing AI Prompt Pack 300+ Prompts', price: 19.99, sales: 8900, rating: 4.8, tags: ['marketing prompts', 'ai writing', 'content creation'] },
]

const MARKET_INSIGHTS = [
  { niche: 'AI Business Prompts', avgPrice: 27, topSales: 8900, competition: 'medium', opportunity: 'high' },
  { niche: 'Notion Templates', avgPrice: 42, topSales: 6200, competition: 'high', opportunity: 'medium' },
  { niche: 'Spreadsheet Trackers', avgPrice: 31, topSales: 12000, competition: 'high', opportunity: 'medium' },
  { niche: 'PDF Business Guides', avgPrice: 24, topSales: 5400, competition: 'low', opportunity: 'high' },
  { niche: 'Prompt Packs (Niche)', avgPrice: 22, topSales: 3200, competition: 'low', opportunity: 'high' },
]

export default function ResearchPage() {
  return (
    <div>
      <Header title="Competitive Research" subtitle="Market intelligence and competitor analysis" />

      <div className="p-6 space-y-6">
        {/* Market Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Market Size Est.', value: '$2.4M/mo', icon: <DollarSign className="w-4 h-4 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Avg Product Price', value: '$34.20', icon: <Tag className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Top Seller Sales', value: '12,400', icon: <TrendingUp className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50' },
            { label: 'Active Competitors', value: '847', icon: <Users className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-50' },
          ].map(({ label, value, icon, bg }) => (
            <Card key={label}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Niche Opportunities */}
        <Card>
          <CardHeader><CardTitle>Niche Opportunity Analysis</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Niche</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Avg Price</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Top Sales</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Competition</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_INSIGHTS.map((m) => (
                  <tr key={m.niche} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.niche}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${m.avgPrice}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{m.topSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={m.competition === 'low' ? 'green' : m.competition === 'medium' ? 'yellow' : 'red'}>
                        {m.competition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={m.opportunity === 'high' ? 'green' : 'yellow'}>{m.opportunity}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Competitors */}
        <Card>
          <CardHeader><CardTitle>Top Competitor Listings</CardTitle></CardHeader>
          <div className="space-y-3">
            {MOCK_COMPETITORS.map((c, i) => (
              <div key={c.shopName} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.productTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {c.shopName} · ⭐ {c.rating} · {c.sales.toLocaleString()} sales</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">${c.price}</p>
                  <p className="text-xs text-gray-500">${(c.price * c.sales).toLocaleString()} rev</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
