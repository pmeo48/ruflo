import { NextRequest, NextResponse } from 'next/server'
import { getCoupons, createCoupon, updateCouponStatus, deleteCoupon } from '@/lib/coupons'
import { CouponStatus, CouponType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const coupons = await getCoupons()
    return NextResponse.json({ coupons })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body._action === 'status') {
      await updateCouponStatus(body.id, body.status as CouponStatus)
      return NextResponse.json({ success: true })
    }

    if (body._action === 'delete') {
      await deleteCoupon(body.id)
      return NextResponse.json({ success: true })
    }

    const coupon = await createCoupon({
      code: body.code,
      description: body.description,
      type: body.type as CouponType,
      value: Number(body.value),
      minOrderAmount: body.minOrderAmount ? Number(body.minOrderAmount) : undefined,
      maxUses: body.maxUses ? Number(body.maxUses) : undefined,
      productIds: body.productIds,
      expiresAt: body.expiresAt,
      prefix: body.prefix,
    })

    return NextResponse.json({ coupon })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
