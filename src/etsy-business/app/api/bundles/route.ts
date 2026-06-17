import { NextRequest, NextResponse } from 'next/server'
import { MOCK_BUNDLES, MOCK_PRODUCTS } from '@/lib/mock-data'

export async function GET() {
  try {
    return NextResponse.json({ bundles: MOCK_BUNDLES, total: MOCK_BUNDLES.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, productIds, price } = body

    const selectedProducts = MOCK_PRODUCTS.filter(p => productIds.includes(p.id))
    const originalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0)

    const bundle = {
      id: Date.now().toString(),
      name,
      description,
      productIds,
      price: price || Math.round(originalPrice * 0.6),
      originalPrice,
      savings: originalPrice - (price || Math.round(originalPrice * 0.6)),
      status: 'draft' as const,
      revenue: 0,
      sales: 0,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ bundle }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
