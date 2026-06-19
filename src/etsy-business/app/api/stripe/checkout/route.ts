import { NextResponse } from 'next/server'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { productId, productName, price, description } = await req.json()

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    if (!isStripeConfigured()) {
      // Demo mode - return a mock session URL
      return NextResponse.json({
        url: `${origin}/store/success?session_id=demo_${productId}&product=${encodeURIComponent(productName)}`,
        demo: true,
        message: 'Demo mode: Add STRIPE_SECRET_KEY to .env.local to enable real payments',
      })
    }

    const session = await createCheckoutSession({
      productId,
      productName,
      price,
      description,
      successUrl: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/store`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
