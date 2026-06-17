import { NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json(MOCK_PRODUCTS)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const newProduct = {
      id: String(MOCK_PRODUCTS.length + 1),
      ...body,
      revenue: 0,
      sales: 0,
      views: 0,
      favorites: 0,
      conversionRate: 0,
      reviewCount: 0,
      mockupUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(newProduct, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
