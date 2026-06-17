'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MOCK_ANALYTICS, MOCK_PRODUCTS, MOCK_DASHBOARD_STATS } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import { format } from 'date-fns'

export default function AnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS
  const chartData = MOCK_ANALYTICS.slice(-14).map(d => ({
    date: format(new Date(d.period), 'MMM d'),
    revenue: d.revenue,
    orders: d.orders,
    views: d.views,
    conversionRate: Math.round(d.conversionRate * 100) / 100,
  }))

  const totalRevenue = MOCK_ANALYTICS.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = MOCK_ANALYTICS.reduce((s, d) => s + d.orders, 0)
  const avgConversion = MOCK_ANALYTICS.reduce((s, d) => s + d.conversionRate, 0) / MOCK_ANALYTICS.length

  return (
    <div>
      <Header title="Analytics" subtitle="Last 30 days performance overview" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '30-Day Revenue', value: formatCurrency(totalRevenue), change: '+23%' },
            { label: 'Total Orders', value: formatNumber(totalOrders), change: '+18%' },
            { label: 'Avg Conversion', value: `${avgConversion.toFixed(2)}%`, change: '+5%' },
            { label: 'Avg Order Value', value: formatCurrency(totalRevenue / totalOrders), change: '+3%' },
          ].map(({ label, value, change }) => (
            <Card key={label}>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              <p className="text-xs text-green-600 font-medium mt-1">{change} vs prev period</p>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader><CardTitle>Daily Revenue (Last 14 Days)</CardTitle></CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Orders + Conversion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Daily Orders</CardTitle></CardHeader>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Conversion Rate (%)</CardTitle></CardHeader>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Line type="monotone" dataKey="conversionRate" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Product Performance Table */}
        <Card>
          <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Product</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Sales</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Views</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Conv.</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Favs</th>
                </tr>
              </thead>
              <tbody>
                {[...MOCK_PRODUCTS].sort((a, b) => b.revenue - a.revenue).map(p => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.sales}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(p.views)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.conversionRate > 0.8 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {p.conversionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(p.favorites)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
