import { NextResponse } from 'next/server'
import { sendOrderConfirmationEmail, isEmailConfigured } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    if (!isEmailConfigured()) {
      return NextResponse.json({ success: true, demo: true, message: 'Demo mode — RESEND_API_KEY not set' })
    }

    const result = await sendOrderConfirmationEmail({
      to: email,
      customerName: 'Test Customer',
      productName: 'AI Business Growth Vault',
      productType: 'pdf',
      orderId: `test-${Date.now()}`,
      amount: 297,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
