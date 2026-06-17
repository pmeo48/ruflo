import { NextResponse } from 'next/server'
import { MOCK_BUNDLES, MOCK_PRODUCTS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json(MOCK_BUNDLES)
}

export async function POST(req: Request) {
  try {
    const { productIds } = await req.json()
    const products = MOCK_PRODUCTS.filter(p => productIds.includes(p.id))
    const originalPrice = products.reduce((s, p) => s + p.price, 0)
    const suggestedPrice = Math.round(originalPrice * 0.6)

    const firstWords = products.map(p => p.name.split(' ')[0]).slice(0, 3).join(' + ')
    return NextResponse.json({
      id: `b${Date.now()}`,
      name: `${firstWords} Power Bundle`,
      description: `Save ${Math.round((1 - suggestedPrice / originalPrice) * 100)}% with this curated bundle of ${products.length} top-rated AI products. Everything you need to accelerate your business growth.`,
      productIds,
      price: suggestedPrice,
      originalPrice,
      savings: originalPrice - suggestedPrice,
      status: 'draft',
      revenue: 0,
      sales: 0,
      createdAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
