import { AnalyticsData, Product } from './types'

export function calculateRevenueGrowth(current: number, previous: number): number {
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function calculateConversionRate(sales: number, views: number): number {
  if (views === 0) return 0
  return Math.round((sales / views) * 100 * 100) / 100
}

export function getTopProducts(products: Product[], limit = 5): Product[] {
  return [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function aggregateAnalytics(data: AnalyticsData[]): {
  totalRevenue: number
  totalOrders: number
  totalViews: number
  avgConversionRate: number
} {
  return {
    totalRevenue: data.reduce((sum, d) => sum + d.revenue, 0),
    totalOrders: data.reduce((sum, d) => sum + d.orders, 0),
    totalViews: data.reduce((sum, d) => sum + d.views, 0),
    avgConversionRate: data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length,
  }
}
