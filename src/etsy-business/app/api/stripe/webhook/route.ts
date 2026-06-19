import { NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  try {
    const event = await constructWebhookEvent(payload, signature)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { productId?: string; productName?: string }
        customer_email?: string
        amount_total?: number | null
        id: string
      }
      const { productId } = session.metadata ?? {}

      if (productId && supabase) {
        // Record the order
        await supabase.from('orders').insert({
          product_id: productId,
          amount: (session.amount_total ?? 0) / 100,
          status: 'completed',
          etsy_order_id: session.id,
        })

        // Increment sales count
        await supabase.rpc('increment_product_sales', { p_id: productId })
      }

      // Send order confirmation email
      if (session.customer_email) {
        let productName = session.metadata?.productName || 'Your Product'
        let productType = 'digital download'
        if (supabase && productId) {
          const { data: product } = await supabase
            .from('products')
            .select('name, type')
            .eq('id', productId)
            .single()
          if (product) {
            productName = product.name
            productType = product.type
          }
        }

        await sendOrderConfirmationEmail({
          to: session.customer_email,
          productName,
          productType,
          orderId: session.id,
          amount: (session.amount_total ?? 0) / 100,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
