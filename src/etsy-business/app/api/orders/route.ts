import { NextResponse } from 'next/server'
import { getOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const orders = await getOrders()
    const totalRevenue = orders.reduce((s, o) => s + o.amount, 0)
    const completedOrders = orders.filter((o) => o.status === 'completed').length
    return NextResponse.json({ orders, totalRevenue, completedOrders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
