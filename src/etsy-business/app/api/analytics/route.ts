import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ANALYTICS, MOCK_PRODUCTS, MOCK_DASHBOARD_STATS } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const productId = searchParams.get('productId')

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const analyticsData = MOCK_ANALYTICS.slice(-days)

    const summary = {
      totalRevenue: analyticsData.reduce((s, d) => s + d.revenue, 0),
      totalOrders: analyticsData.reduce((s, d) => s + d.orders, 0),
      totalViews: analyticsData.reduce((s, d) => s + d.views, 0),
      avgConversionRate: analyticsData.reduce((s, d) => s + d.conversionRate, 0) / analyticsData.length,
    }

    return NextResponse.json({
      data: analyticsData,
      summary,
      stats: MOCK_DASHBOARD_STATS,
      products: productId ? MOCK_PRODUCTS.filter(p => p.id === productId) : MOCK_PRODUCTS,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
