import { NextResponse } from 'next/server'
import { createCheckoutSession, isStripeConfigured, stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { productId, productName, price, description, affiliateCode } = await req.json()

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    if (!isStripeConfigured()) {
      // Demo mode - return a mock session URL
      return NextResponse.json({
        url: `${origin}/store/success?session_id=demo_${productId}&product=${encodeURIComponent(productName)}`,
        demo: true,
        message: 'Demo mode: Add STRIPE_SECRET_KEY to .env.local to enable real payments',
      })
    }

    // If affiliateCode present, create session directly to pass extended metadata
    if (affiliateCode && stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: productName, description },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/store`,
        metadata: { productId, productName, affiliateCode },
        allow_promotion_codes: true,
      })
      return NextResponse.json({ url: session.url, sessionId: session.id })
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
