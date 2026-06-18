import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe: Stripe | null = secretKey
  ? new Stripe(secretKey, { apiVersion: '2026-05-27.dahlia' })
  : null

export const isStripeConfigured = () => !!stripe

export async function createCheckoutSession({
  productId,
  productName,
  price,
  description,
  successUrl,
  cancelUrl,
  customerEmail,
}: {
  productId: string
  productName: string
  price: number
  description: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}) {
  if (!stripe) throw new Error('Stripe not configured')

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: productName,
          description,
          metadata: { productId },
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: { productId },
    allow_promotion_codes: true,
  })
}

export async function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) throw new Error('Stripe webhook not configured')
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
