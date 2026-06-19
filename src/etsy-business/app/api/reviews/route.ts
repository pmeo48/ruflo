import { NextRequest, NextResponse } from 'next/server'
import { getReviews, createReview, updateReviewStatus, replyToReview } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId') ?? undefined
    const status = searchParams.get('status') as 'pending' | 'published' | 'rejected' | undefined
    const reviews = await getReviews({ productId, status })
    return NextResponse.json({ reviews })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body._action === 'status') {
      await updateReviewStatus(body.id, body.status)
      return NextResponse.json({ success: true })
    }

    if (body._action === 'reply') {
      await replyToReview(body.id, body.reply)
      return NextResponse.json({ success: true })
    }

    const review = await createReview({
      productId: body.productId,
      productName: body.productName,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      rating: body.rating,
      title: body.title,
      body: body.body,
    })

    return NextResponse.json({ review })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
