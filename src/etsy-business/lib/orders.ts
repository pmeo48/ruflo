import { supabase } from './supabase'
import { MOCK_PRODUCTS } from './mock-data'

export interface Order {
  id: string
  productId: string
  productName: string
  productType: string
  amount: number
  status: 'completed' | 'pending' | 'refunded'
  downloadUrl: string
  downloadExpiresAt: string
  customerEmail?: string
  stripeSessionId?: string
  createdAt: string
}

const MOCK_ORDERS: Order[] = MOCK_PRODUCTS.slice(0, 5).map((p, i) => ({
  id: `order-${i + 1}`,
  productId: p.id,
  productName: p.name,
  productType: p.type,
  amount: p.price,
  status: 'completed',
  downloadUrl: `https://example.com/downloads/${p.id}/file.pdf`,
  downloadExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  customerEmail: 'customer@example.com',
  createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
}))

export async function getOrders(limit = 50): Promise<Order[]> {
  if (!supabase) return MOCK_ORDERS

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return MOCK_ORDERS

  return data.map((r) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name ?? 'Unknown Product',
    productType: r.product_type ?? 'pdf',
    amount: r.amount,
    status: r.status,
    downloadUrl: r.download_url ?? '#',
    downloadExpiresAt: r.download_expires_at ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: r.customer_email,
    stripeSessionId: r.stripe_session_id,
    createdAt: r.created_at,
  }))
}

export async function getOrderBySession(sessionId: string): Promise<Order | null> {
  if (!supabase || sessionId.startsWith('demo_')) {
    return MOCK_ORDERS[0]
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    productId: data.product_id,
    productName: data.product_name ?? 'Your Product',
    productType: data.product_type ?? 'pdf',
    amount: data.amount,
    status: data.status,
    downloadUrl: data.download_url ?? '#',
    downloadExpiresAt: data.download_expires_at ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: data.customer_email,
    stripeSessionId: data.stripe_session_id,
    createdAt: data.created_at,
  }
}

export function generateDownloadUrl(productId: string): string {
  // In production: generate a signed, time-limited URL (e.g. Supabase Storage signed URL)
  const token = Buffer.from(`${productId}:${Date.now()}`).toString('base64url')
  return `/api/orders/download?token=${token}`
}
