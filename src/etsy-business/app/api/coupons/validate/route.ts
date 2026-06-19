import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon, applyDiscount } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, orderAmount, productId } = await req.json()

    if (!code || !orderAmount) {
      return NextResponse.json({ valid: false, error: 'Missing code or order amount' }, { status: 400 })
    }

    const result = await validateCoupon(code, Number(orderAmount), productId)

    if (!result.valid || !result.coupon) {
      return NextResponse.json({ valid: false, error: result.error })
    }

    const discountedPrice = applyDiscount(Number(orderAmount), result.coupon)
    const savings = Number(orderAmount) - discountedPrice

    return NextResponse.json({
      valid: true,
      coupon: result.coupon,
      originalPrice: Number(orderAmount),
      discountedPrice,
      savings,
    })
  } catch (e) {
    return NextResponse.json({ valid: false, error: String(e) }, { status: 500 })
  }
}
