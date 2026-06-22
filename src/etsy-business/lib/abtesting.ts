export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed'
export type ABTestMetric = 'conversion_rate' | 'clicks' | 'revenue' | 'favorites'
export type ABVariantType = 'title' | 'price' | 'description' | 'thumbnail' | 'cta'

export interface ABVariant {
  id: string
  label: string  // 'A' | 'B' | 'C'
  type: ABVariantType
  value: string  // the actual content being tested
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  favorites: number
}

export interface ABTest {
  id: string
  name: string
  productId: string
  productName: string
  status: ABTestStatus
  metric: ABTestMetric
  variants: ABVariant[]
  trafficSplit: number[]  // e.g. [50, 50] or [33, 33, 34]
  winnerVariantId?: string
  confidenceLevel?: number  // 0-100
  startedAt?: string
  endedAt?: string
  createdAt: string
  notes?: string
}

import { supabase } from './supabase'
import { MOCK_PRODUCTS } from './mock-data'

const MOCK_TESTS: ABTest[] = [
  {
    id: 'test-1',
    name: 'Insurance Toolkit — Title Test',
    productId: '1',
    productName: 'AI Insurance Agent Toolkit',
    status: 'running',
    metric: 'conversion_rate',
    variants: [
      {
        id: 'v1a',
        label: 'A',
        type: 'title',
        value: 'AI Insurance Agent Toolkit — 250+ ChatGPT Prompts & Scripts',
        impressions: 3840,
        clicks: 312,
        conversions: 48,
        revenue: 1296,
        favorites: 284,
      },
      {
        id: 'v1b',
        label: 'B',
        type: 'title',
        value: 'Close More Insurance Sales with AI — Complete Agent Prompt Pack',
        impressions: 3820,
        clicks: 358,
        conversions: 61,
        revenue: 1647,
        favorites: 331,
      },
    ],
    trafficSplit: [50, 50],
    confidenceLevel: 82,
    startedAt: '2024-11-01T00:00:00Z',
    createdAt: '2024-10-30T00:00:00Z',
  },
  {
    id: 'test-2',
    name: 'Agency-in-a-Box — Price Test',
    productId: '2',
    productName: 'AI Agency-in-a-Box',
    status: 'completed',
    metric: 'revenue',
    variants: [
      {
        id: 'v2a',
        label: 'A',
        type: 'price',
        value: '$37',
        impressions: 2100,
        clicks: 189,
        conversions: 22,
        revenue: 814,
        favorites: 156,
      },
      {
        id: 'v2b',
        label: 'B',
        type: 'price',
        value: '$47',
        impressions: 2080,
        clicks: 184,
        conversions: 19,
        revenue: 893,
        favorites: 149,
      },
    ],
    trafficSplit: [50, 50],
    winnerVariantId: 'v2b',
    confidenceLevel: 91,
    startedAt: '2024-10-01T00:00:00Z',
    endedAt: '2024-10-28T00:00:00Z',
    createdAt: '2024-09-28T00:00:00Z',
    notes: 'Higher price won on revenue despite lower conversion count.',
  },
  {
    id: 'test-3',
    name: 'Content Creator — CTA Test',
    productId: '4',
    productName: 'AI Content Creation System',
    status: 'draft',
    metric: 'clicks',
    variants: [
      {
        id: 'v3a',
        label: 'A',
        type: 'cta',
        value: 'Buy Now — Instant Download',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        favorites: 0,
      },
      {
        id: 'v3b',
        label: 'B',
        type: 'cta',
        value: 'Get Instant Access for $17',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        favorites: 0,
      },
    ],
    trafficSplit: [50, 50],
    createdAt: '2024-12-01T00:00:00Z',
  },
]

export async function getTests(): Promise<ABTest[]> {
  if (!supabase) return MOCK_TESTS
  // Supabase integration placeholder — falls back to mock
  return MOCK_TESTS
}

export async function createTest(params: {
  name: string
  productId: string
  metric: ABTestMetric
  variants: { type: ABVariantType; value: string }[]
  notes?: string
}): Promise<ABTest> {
  const product = MOCK_PRODUCTS.find((p) => p.id === params.productId)
  const letters = ['A', 'B', 'C', 'D']

  const test: ABTest = {
    id: `test-${Date.now()}`,
    name: params.name,
    productId: params.productId,
    productName: product?.name ?? 'Unknown Product',
    status: 'draft',
    metric: params.metric,
    variants: params.variants.map((v, i) => ({
      id: `v-${Date.now()}-${i}`,
      label: letters[i],
      type: v.type,
      value: v.value,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      favorites: 0,
    })),
    trafficSplit: params.variants.map(() => Math.floor(100 / params.variants.length)),
    createdAt: new Date().toISOString(),
    notes: params.notes,
  }

  MOCK_TESTS.unshift(test)
  return test
}

export function computeWinner(test: ABTest): { winnerId: string | null; confidence: number; lift: number } {
  if (test.variants.length < 2) return { winnerId: null, confidence: 0, lift: 0 }

  const metric = test.metric

  const scores = test.variants.map((v) => {
    if (metric === 'conversion_rate') return v.impressions > 0 ? v.conversions / v.impressions : 0
    if (metric === 'revenue') return v.revenue
    if (metric === 'clicks') return v.impressions > 0 ? v.clicks / v.impressions : 0
    if (metric === 'favorites') return v.favorites
    return 0
  })

  const maxScore = Math.max(...scores)
  const maxIdx = scores.indexOf(maxScore)
  const secondMax = Math.max(...scores.filter((_, i) => i !== maxIdx))

  if (maxScore === 0 || secondMax === 0) return { winnerId: null, confidence: 0, lift: 0 }

  const lift = ((maxScore - secondMax) / secondMax) * 100
  // Simplified confidence based on total impressions and lift
  const totalImpressions = test.variants.reduce((s, v) => s + v.impressions, 0)
  const confidence = Math.min(99, Math.round(50 + lift * 2 + totalImpressions / 500))

  return {
    winnerId: test.variants[maxIdx].id,
    confidence,
    lift,
  }
}

export function getVariantMetricValue(variant: ABVariant, metric: ABTestMetric): number {
  if (metric === 'conversion_rate') return variant.impressions > 0 ? (variant.conversions / variant.impressions) * 100 : 0
  if (metric === 'revenue') return variant.revenue
  if (metric === 'clicks') return variant.impressions > 0 ? (variant.clicks / variant.impressions) * 100 : 0
  if (metric === 'favorites') return variant.favorites
  return 0
}

export function getMetricLabel(metric: ABTestMetric): string {
  const labels: Record<ABTestMetric, string> = {
    conversion_rate: 'Conversion Rate',
    clicks: 'Click-Through Rate',
    revenue: 'Revenue',
    favorites: 'Favorites',
  }
  return labels[metric]
}

export function getMetricUnit(metric: ABTestMetric): string {
  if (metric === 'revenue') return '$'
  if (metric === 'conversion_rate' || metric === 'clicks') return '%'
  return ''
}
