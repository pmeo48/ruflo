'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2,
  ChevronRight, RefreshCw, ShoppingBag, Search, Image, Star, Mail,
  Share2, DollarSign, Users, Zap, ClipboardCheck, Target, Lightbulb
} from 'lucide-react'

interface HealthMetric {
  id: string
  label: string
  score: number
  status: 'good' | 'warn' | 'critical'
  trend: 'up' | 'down' | 'flat'
  issue: string
  action: string
  href: string
  icon: React.ElementType
}

function buildMetrics(): HealthMetric[] {
  // In a real app these would come from Supabase queries.
  // In demo mode we return realistic mock data that changes slightly on each call
  // to simulate a real shop with room to improve.
  const rand = (base: number, spread = 8) => Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.5) * spread)))
  return [
    {
      id: 'listings',
      label: 'Listing Quality',
      score: rand(62),
      status: 'warn',
      trend: 'up',
      issue: 'Several listings have titles under 100 characters and fewer than 10 tags.',
      action: 'Run a Listing Audit on your top 3 products and fill all 13 tag slots.',
      href: '/listing-audit',
      icon: ClipboardCheck,
    },
    {
      id: 'seo',
      label: 'SEO Coverage',
      score: rand(55),
      status: 'warn',
      trend: 'flat',
      issue: 'Only 4 of 10 products have keyword-rich titles using long-tail phrases.',
      action: 'Use Keyword Research to find 3 high-opportunity keywords per product.',
      href: '/keywords',
      icon: Search,
    },
    {
      id: 'photos',
      label: 'Visual Presentation',
      score: rand(48),
      status: 'critical',
      trend: 'flat',
      issue: 'Average listing has 3.2 images. Etsy allows 10 — competitors average 7.',
      action: 'Create mockup images in Design Studio and add a "What\'s Included" graphic.',
      href: '/design',
      icon: Image,
    },
    {
      id: 'reviews',
      label: 'Social Proof',
      score: rand(71),
      status: 'good',
      trend: 'up',
      issue: '3 recent reviews haven\'t received a reply from the shop owner.',
      action: 'Reply to all reviews (positive & negative) within 48 hours to boost Star Seller status.',
      href: '/reviews',
      icon: Star,
    },
    {
      id: 'pricing',
      label: 'Pricing Strategy',
      score: rand(66),
      status: 'warn',
      trend: 'up',
      issue: '2 products are priced below the market median for their keyword.',
      action: 'Run Price Optimizer to identify underpriced listings and test a 15% increase.',
      href: '/pricing',
      icon: DollarSign,
    },
    {
      id: 'marketing',
      label: 'Marketing Activity',
      score: rand(39),
      status: 'critical',
      trend: 'down',
      issue: 'No Pinterest pins in 14 days. External traffic accounts for <5% of visits.',
      action: 'Pin your top 3 products to 5 boards each on Pinterest to drive external traffic.',
      href: '/pinterest',
      icon: Share2,
    },
    {
      id: 'email',
      label: 'Email Marketing',
      score: rand(44),
      status: 'critical',
      trend: 'flat',
      issue: 'No marketing emails sent this month. Repeat buyers convert at 5× the rate of new visitors.',
      action: 'Send a new product announcement or seasonal promotion to your subscriber list.',
      href: '/emails',
      icon: Mail,
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      score: rand(58),
      status: 'warn',
      trend: 'up',
      issue: 'Shop converts at ~1.8%. Industry average for digital products is 2.5–4%.',
      action: 'A/B test your main product thumbnail and add urgency to your top listing description.',
      href: '/abtesting',
      icon: TrendingUp,
    },
    {
      id: 'affiliates',
      label: 'Referral Program',
      score: rand(33),
      status: 'critical',
      trend: 'flat',
      issue: 'Affiliate program has 2 partners but neither has generated a click this month.',
      action: 'Reach out to affiliates with a fresh promo asset and updated commission offer.',
      href: '/affiliates',
      icon: Users,
    },
    {
      id: 'automation',
      label: 'Automation & Systems',
      score: rand(52),
      status: 'warn',
      trend: 'up',
      issue: 'Order confirmation emails are disabled. Automated follow-ups are not configured.',
      action: 'Enable order confirmation emails and set up a 3-day post-purchase review request.',
      href: '/automation',
      icon: Zap,
    },
  ]
}

const STATUS_CONFIG = {
  good: { color: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-200', badge: 'bg-green-100 text-green-700' },
  warn: { color: 'text-yellow-600', bg: 'bg-yellow-500', ring: 'ring-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  critical: { color: 'text-red-600', bg: 'bg-red-400', ring: 'ring-red-200', badge: 'bg-red-100 text-red-700' },
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
  return <Minus className="h-3.5 w-3.5 text-gray-400" />
}

function ScoreGauge({ score, status }: { score: number; status: 'good' | 'warn' | 'critical' }) {
  const cfg = STATUS_CONFIG[status]
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const colors = { good: '#22c55e', warn: '#eab308', critical: '#f87171' }

  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
      <circle
        cx="65" cy="65" r={r} fill="none" stroke={colors[status]} strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="65" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="800" fill={colors[status]}>
        {score}
      </text>
      <text x="65" y="78" textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#9ca3af">
        / 100
      </text>
    </svg>
  )
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const cfg = STATUS_CONFIG[metric.status]
  const Icon = metric.icon

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${metric.status === 'critical' ? 'bg-red-50' : metric.status === 'warn' ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <Icon className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <span className="font-semibold text-gray-900 text-sm">{metric.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendBadge trend={metric.trend} />
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
            {metric.score}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${cfg.bg}`} style={{ width: `${metric.score}%` }} />
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-2">{metric.issue}</p>

      <Link href={metric.href} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
        {metric.action.split(' ').slice(0, 4).join(' ')}… <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

export default function HealthPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>(() => buildMetrics())
  const [refreshing, setRefreshing] = useState(false)

  const overallScore = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)
  const overallStatus: 'good' | 'warn' | 'critical' =
    overallScore >= 70 ? 'good' : overallScore >= 50 ? 'warn' : 'critical'

  const critical = metrics.filter((m) => m.status === 'critical').sort((a, b) => a.score - b.score)
  const warnings = metrics.filter((m) => m.status === 'warn').sort((a, b) => a.score - b.score)
  const healthy = metrics.filter((m) => m.status === 'good')

  function refresh() {
    setRefreshing(true)
    setTimeout(() => {
      setMetrics(buildMetrics())
      setRefreshing(false)
    }, 800)
  }

  const gradeLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 65 ? 'Good' : overallScore >= 50 ? 'Needs Work' : 'At Risk'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Activity className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shop Health</h1>
            <p className="text-sm text-gray-600">Scored overview of every business dimension with your top priorities.</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
        <ScoreGauge score={overallScore} status={overallStatus} />
        <div className="flex-1 text-center md:text-left">
          <p className="text-3xl font-bold text-gray-900 mb-1">{gradeLabel}</p>
          <p className="text-gray-600 mb-4">
            Your shop scored <strong>{overallScore}/100</strong> across {metrics.length} health dimensions.
            {critical.length > 0 && ` ${critical.length} area${critical.length > 1 ? 's' : ''} need immediate attention.`}
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{critical.length}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{warnings.length}</p>
              <p className="text-xs text-gray-500">Warnings</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{healthy.length}</p>
              <p className="text-xs text-gray-500">Healthy</p>
            </div>
          </div>
        </div>

        {/* Quick wins */}
        {critical.length > 0 && (
          <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 w-full md:w-auto">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Top Priority
            </p>
            {critical.slice(0, 2).map((m) => (
              <Link key={m.id} href={m.href} className="block mb-2 last:mb-0">
                <p className="text-sm font-medium text-red-800">{m.label} — {m.score}/100</p>
                <p className="text-xs text-red-600">{m.action}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Critical */}
      {critical.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Critical ({critical.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {critical.map((m) => <MetricCard key={m.id} metric={m} />)}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-3">
            Warnings ({warnings.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {warnings.map((m) => <MetricCard key={m.id} metric={m} />)}
          </div>
        </div>
      )}

      {/* Healthy */}
      {healthy.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Healthy ({healthy.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {healthy.map((m) => <MetricCard key={m.id} metric={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}
