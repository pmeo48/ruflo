'use client'

import { TrendingUp, ShoppingBag, Eye, Percent } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MOCK_ANALYTICS, MOCK_PRODUCTS, MOCK_DASHBOARD_STATS } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/analytics'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const revenueData = MOCK_ANALYTICS.slice(-14).map((d) => ({
  date: d.period.slice(5),
  revenue: d.revenue,
  orders: d.orders,
}))

const productData = MOCK_PRODUCTS.slice(0, 6).map((p) => ({
  name: p.name.split(' ').slice(0, 2).join(' '),
  revenue: p.revenue,
  sales: p.sales,
}))

const monthlyGrowth = [
  { month: 'Jan', revenue: 48200 },
  { month: 'Feb', revenue: 55100 },
  { month: 'Mar', revenue: 61400 },
  { month: 'Apr', revenue: 58700 },
  { month: 'May', revenue: 67300 },
  { month: 'Jun', revenue: 74200 },
]

export default function AnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS
  return (
    <div>
      <Header title="Analytics" subtitle="Revenue, sales, and conversion data" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Sales', value: stats.totalSales.toLocaleString(), icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Annual Revenue', value: formatCurrency(stats.annualRevenue), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg Conversion', value: `${stats.avgConversionRate}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader><CardTitle>Daily Revenue (Last 14 Days)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Product Revenue Comparison</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader><CardTitle>Monthly Revenue Growth</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Conversion Rate by Product</CardTitle></CardHeader>
          <div className="space-y-3 mt-2">
            {MOCK_PRODUCTS.map((p) => (
              <div key={p.id} className="flex items-center gap-4">
                <div className="w-40 text-sm text-gray-700 truncate">{p.name.split(' ').slice(0, 3).join(' ')}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(p.conversionRate * 50, 100)}%`, backgroundColor: p.conversionRate > 0.9 ? '#10b981' : p.conversionRate > 0.7 ? '#6366f1' : '#f59e0b' }} />
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900">{p.conversionRate}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
