import {
  DollarSign, TrendingUp, Package, ShoppingBag, Eye, Heart, Star, Zap
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { RevenueCard } from '@/components/dashboard/RevenueCard'
import { ProductLeaderboard } from '@/components/dashboard/ProductLeaderboard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS, MOCK_DASHBOARD_STATS, MOCK_ANALYTICS } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/analytics'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const stats = MOCK_DASHBOARD_STATS
  const totalViews = MOCK_PRODUCTS.reduce((sum, p) => sum + p.views, 0)
  const totalFavorites = MOCK_PRODUCTS.reduce((sum, p) => sum + p.favorites, 0)
  const topRatedProduct = [...MOCK_PRODUCTS].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))[0]

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your Etsy business."
        actions={
          <Link href="/products/new">
            <Button size="sm">
              <Zap className="w-4 h-4" />
              Generate Product
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Revenue Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RevenueCard
            label="Today's Revenue"
            value={stats.todayRevenue}
            change={8.2}
            period="yesterday"
            icon={<DollarSign className="w-5 h-5" />}
            color="indigo"
          />
          <RevenueCard
            label="This Week"
            value={stats.weeklyRevenue}
            change={stats.revenueGrowth}
            period="last week"
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <RevenueCard
            label="This Month"
            value={stats.monthlyRevenue}
            change={23.4}
            period="last month"
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <RevenueCard
            label="Annual Revenue"
            value={stats.annualRevenue}
            change={41.2}
            period="last year"
            icon={<Star className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Products</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(stats.totalSales)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Views</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(totalViews)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Favorites</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(totalFavorites)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SalesChart data={MOCK_ANALYTICS} />

          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Conversion</span>
                <span className="font-semibold text-gray-900">{stats.avgConversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Listings</span>
                <Badge variant="green">{stats.activeListings} active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sales Growth</span>
                <span className="text-green-600 font-semibold">+{stats.salesGrowth}%</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Top Rated Product</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{topRatedProduct?.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-600">{topRatedProduct?.avgRating} ({topRatedProduct?.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <Link href="/seo" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <Zap className="w-4 h-4" /> Run SEO Audit
                </Link>
                <Link href="/expansion" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <TrendingUp className="w-4 h-4" /> View Expansion Ideas
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Product Leaderboard */}
        <ProductLeaderboard products={MOCK_PRODUCTS} />
      </div>
    </div>
  )
}
