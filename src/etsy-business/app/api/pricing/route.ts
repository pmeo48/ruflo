import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { analyzePricing, analyzePricingBatch } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { productId, all } = await req.json()

    if (all) {
      const analyses = await analyzePricingBatch(MOCK_PRODUCTS)
      return NextResponse.json({ analyses })
    }

    const product = MOCK_PRODUCTS.find((p) => p.id === productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const analysis = await analyzePricing(product)
    return NextResponse.json({ analysis })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
