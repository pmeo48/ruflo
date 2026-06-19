import { Coupon, CouponType, CouponStatus } from './types'
import { supabase } from './supabase'

const MOCK_COUPONS: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME20',
    description: '20% off for new customers',
    type: 'percentage',
    value: 20,
    minOrderAmount: 10,
    maxUses: 500,
    usedCount: 147,
    productIds: [],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'SAVE10',
    description: '$10 off orders over $49',
    type: 'fixed',
    value: 10,
    minOrderAmount: 49,
    maxUses: 200,
    usedCount: 83,
    productIds: [],
    status: 'active',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'FLASH50',
    description: '50% flash sale — limited time',
    type: 'percentage',
    value: 50,
    minOrderAmount: 0,
    maxUses: 100,
    usedCount: 100,
    productIds: [],
    status: 'expired',
    expiresAt: '2024-03-01T00:00:00Z',
    createdAt: '2024-02-15T00:00:00Z',
  },
]

function generateCode(prefix = ''): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return prefix ? `${prefix.toUpperCase()}-${random}` : random
}

export async function getCoupons(): Promise<Coupon[]> {
  if (!supabase) return MOCK_COUPONS

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return MOCK_COUPONS

  return data.map((r) => ({
    id: r.id,
    code: r.code,
    description: r.description,
    type: r.type as CouponType,
    value: r.value,
    minOrderAmount: r.min_order_amount,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    productIds: r.product_ids ?? [],
    status: r.status as CouponStatus,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }))
}

export async function createCoupon(params: {
  code?: string
  description: string
  type: CouponType
  value: number
  minOrderAmount?: number
  maxUses?: number
  productIds?: string[]
  expiresAt?: string
  prefix?: string
}): Promise<Coupon> {
  const code = params.code?.toUpperCase() || generateCode(params.prefix)

  const coupon: Coupon = {
    id: crypto.randomUUID(),
    code,
    description: params.description,
    type: params.type,
    value: params.value,
    minOrderAmount: params.minOrderAmount,
    maxUses: params.maxUses,
    usedCount: 0,
    productIds: params.productIds ?? [],
    status: 'active',
    expiresAt: params.expiresAt,
    createdAt: new Date().toISOString(),
  }

  if (!supabase) return coupon

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.minOrderAmount ?? 0,
      max_uses: coupon.maxUses ?? null,
      used_count: 0,
      product_ids: coupon.productIds,
      status: 'active',
      expires_at: coupon.expiresAt ?? null,
      created_at: coupon.createdAt,
    })
    .select()
    .single()

  if (error || !data) return coupon
  return coupon
}

export async function validateCoupon(
  code: string,
  orderAmount: number,
  productId?: string
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const coupons = await getCoupons()
  const coupon = coupons.find((c) => c.code === code.toUpperCase())

  if (!coupon) return { valid: false, error: 'Coupon code not found' }
  if (coupon.status !== 'active') return { valid: false, error: 'This coupon is no longer active' }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'This coupon has expired' }
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    return { valid: false, error: `Minimum order of $${coupon.minOrderAmount} required` }
  }
  if (coupon.productIds && coupon.productIds.length > 0 && productId && !coupon.productIds.includes(productId)) {
    return { valid: false, error: 'This coupon is not valid for this product' }
  }

  return { valid: true, coupon }
}

export function applyDiscount(price: number, coupon: Coupon): number {
  if (coupon.type === 'percentage') {
    return Math.max(0, price - (price * coupon.value) / 100)
  }
  if (coupon.type === 'fixed') {
    return Math.max(0, price - coupon.value)
  }
  return price
}

export async function updateCouponStatus(id: string, status: CouponStatus): Promise<void> {
  if (!supabase) return
  await supabase.from('coupons').update({ status }).eq('id', id)
}

export async function deleteCoupon(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('coupons').delete().eq('id', id)
}
