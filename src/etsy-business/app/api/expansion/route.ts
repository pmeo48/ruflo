import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { ExpansionVariant } from '@/lib/types'

const NICHES = ['Healthcare', 'Real Estate', 'Legal', 'Finance', 'Education', 'E-commerce', 'SaaS', 'Coaching', 'Restaurant', 'Retail']
const VARIANT_TYPES: Array<{ type: ExpansionVariant['type']; multiplier: number; suffix: string }> = [
  { type: 'lite', multiplier: 0.4, suffix: 'Lite' },
  { type: 'pro', multiplier: 1.8, suffix: 'Pro' },
  { type: 'ultimate', multiplier: 3.2, suffix: 'Ultimate' },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const products = productId
      ? MOCK_PRODUCTS.filter(p => p.id === productId)
      : MOCK_PRODUCTS

    const expansions = products.flatMap(product => {
      const variants: ExpansionVariant[] = [
        ...VARIANT_TYPES.map(({ type, multiplier, suffix }) => ({
          id: `${product.id}-${type}`,
          parentProductId: product.id,
          name: `${product.name} ${suffix}`,
          type,
          priceMultiplier: multiplier,
          additionalFeatures: type === 'lite' ? ['Core prompts only'] : type === 'pro' ? ['Advanced prompts', 'Video walkthrough'] : ['Everything', 'Private 1-on-1 call'],
          estimatedRevenue: Math.round(product.revenue * multiplier * 0.3),
          status: 'suggested' as const,
        })),
        ...NICHES.slice(0, 5).map(niche => ({
          id: `${product.id}-niche-${niche.toLowerCase()}`,
          parentProductId: product.id,
          name: `${product.name.split(' ').slice(0, 3).join(' ')} for ${niche}`,
          type: 'niche' as const,
          nicheTarget: niche,
          priceMultiplier: 1.0,
          additionalFeatures: [`${niche}-specific templates`, `${niche} use cases`, `${niche} examples`],
          estimatedRevenue: Math.round(product.revenue * 0.4),
          status: 'suggested' as const,
        })),
      ]
      return variants
    })

    return NextResponse.json({ expansions, total: expansions.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expansions' }, { status: 500 })
  }
}
