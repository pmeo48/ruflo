import { NextResponse } from 'next/server'
import { MOCK_ANALYTICS, MOCK_PRODUCTS, MOCK_DASHBOARD_STATS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({
    revenue: {
      daily: MOCK_DASHBOARD_STATS.todayRevenue,
      weekly: MOCK_DASHBOARD_STATS.weeklyRevenue,
      monthly: MOCK_DASHBOARD_STATS.monthlyRevenue,
      annual: MOCK_DASHBOARD_STATS.annualRevenue,
    },
    products: MOCK_PRODUCTS.map(p => ({
      id: p.id,
      name: p.name,
      revenue: p.revenue,
      sales: p.sales,
      views: p.views,
      conversionRate: p.conversionRate,
    })),
    conversionRate: MOCK_DASHBOARD_STATS.avgConversionRate,
    growth: {
      revenue: MOCK_DASHBOARD_STATS.revenueGrowth,
      sales: MOCK_DASHBOARD_STATS.salesGrowth,
    },
    timeSeries: MOCK_ANALYTICS,
  })
}
