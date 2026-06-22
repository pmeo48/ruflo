import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

// Public endpoint — customers look up orders by email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // In production: query Supabase orders table by customer_email
    // For demo, return mock orders for any email
    const mockOrders = MOCK_PRODUCTS.slice(0, 4).map((p, i) => ({
      id: `order-${i + 1}`,
      productId: p.id,
      productName: p.name,
      productType: p.type,
      amount: p.price,
      status: 'completed',
      downloadUrl: `/api/orders/download?token=${Buffer.from(`${p.id}:${Date.now()}`).toString('base64url')}`,
      downloadExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customerEmail: email,
      createdAt: new Date(Date.now() - (i + 1) * 86400000 * 5).toISOString(),
    }))

    return NextResponse.json({ orders: mockOrders, email })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
