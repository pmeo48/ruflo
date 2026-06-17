import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_ANALYTICS, MOCK_PRODUCTS, MOCK_DASHBOARD_STATS } from '@/lib/mock-data'
import { AnalyticsData } from '@/lib/types'

interface OrderRow {
  product_id: string | null
  amount: number
  created_at: string
  status: string
}

function buildMockResponse() {
  return {
    revenue: {
      daily: MOCK_DASHBOARD_STATS.todayRevenue,
      weekly: MOCK_DASHBOARD_STATS.weeklyRevenue,
      monthly: MOCK_DASHBOARD_STATS.monthlyRevenue,
      annual: MOCK_DASHBOARD_STATS.annualRevenue,
    },
    products: MOCK_PRODUCTS.map((p) => ({
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
  }
}

export async function GET() {
  if (supabase) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data, error } = await supabase
        .from('orders')
        .select('product_id, amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')

      if (error) throw error

      const orders = (data ?? []) as OrderRow[]

      // Aggregate time series by day
      const byDay = new Map<string, { revenue: number; orders: number }>()
      let totalRevenue = 0

      for (const order of orders) {
        const day = order.created_at.split('T')[0]
        const entry = byDay.get(day) ?? { revenue: 0, orders: 0 }
        entry.revenue += Number(order.amount)
        entry.orders += 1
        byDay.set(day, entry)
        totalRevenue += Number(order.amount)
      }

      const timeSeries: AnalyticsData[] = Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, agg]) => ({
          period,
          revenue: agg.revenue,
          orders: agg.orders,
          views: 0,
          favorites: 0,
          conversionRate: 0,
          avgOrderValue: agg.orders > 0 ? agg.revenue / agg.orders : 0,
        }))

      // Aggregate per product
      const byProduct = new Map<string, { revenue: number; sales: number }>()
      for (const order of orders) {
        if (!order.product_id) continue
        const entry = byProduct.get(order.product_id) ?? { revenue: 0, sales: 0 }
        entry.revenue += Number(order.amount)
        entry.sales += 1
        byProduct.set(order.product_id, entry)
      }

      const productPerformance = Array.from(byProduct.entries()).map(([id, agg]) => ({
        id,
        name: '',
        revenue: agg.revenue,
        sales: agg.sales,
        views: 0,
        conversionRate: 0,
      }))

      // Revenue windows
      const now = Date.now()
      const dayMs = 86400000
      const dailyRevenue = orders
        .filter((o) => now - new Date(o.created_at).getTime() <= dayMs)
        .reduce((s, o) => s + Number(o.amount), 0)
      const weeklyRevenue = orders
        .filter((o) => now - new Date(o.created_at).getTime() <= 7 * dayMs)
        .reduce((s, o) => s + Number(o.amount), 0)

      return NextResponse.json({
        revenue: {
          daily: dailyRevenue,
          weekly: weeklyRevenue,
          monthly: totalRevenue,
          annual: totalRevenue,
        },
        products: productPerformance,
        conversionRate: 0,
        growth: { revenue: 0, sales: 0 },
        timeSeries,
      })
    } catch (err) {
      console.error('Supabase error fetching analytics, falling back to mock:', err)
    }
  }

  return NextResponse.json(buildMockResponse())
}
