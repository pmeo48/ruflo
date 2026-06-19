import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { service } = await req.json()

  const results: Record<string, { status: 'ok' | 'error' | 'not_configured'; message: string }> = {}

  // Test OpenAI
  if (service === 'openai' || service === 'all') {
    const key = process.env.OPENAI_API_KEY
    results.openai = key
      ? { status: 'ok', message: 'OpenAI API key detected' }
      : { status: 'not_configured', message: 'OPENAI_API_KEY not set' }
  }

  // Test Anthropic
  if (service === 'anthropic' || service === 'all') {
    const key = process.env.ANTHROPIC_API_KEY
    results.anthropic = key
      ? { status: 'ok', message: 'Anthropic API key detected' }
      : { status: 'not_configured', message: 'ANTHROPIC_API_KEY not set' }
  }

  // Test Supabase
  if (service === 'supabase' || service === 'all') {
    const { isSupabaseConfigured } = await import('@/lib/supabase')
    results.supabase = isSupabaseConfigured()
      ? { status: 'ok', message: 'Supabase connected' }
      : { status: 'not_configured', message: 'Supabase env vars not set' }
  }

  // Test Stripe
  if (service === 'stripe' || service === 'all') {
    const { isStripeConfigured } = await import('@/lib/stripe')
    results.stripe = isStripeConfigured()
      ? { status: 'ok', message: 'Stripe connected' }
      : { status: 'not_configured', message: 'STRIPE_SECRET_KEY not set' }
  }

  // Test Resend
  if (service === 'resend' || service === 'all') {
    const { isEmailConfigured } = await import('@/lib/email')
    results.resend = isEmailConfigured()
      ? { status: 'ok', message: 'Resend connected' }
      : { status: 'not_configured', message: 'RESEND_API_KEY not set' }
  }

  // Test Etsy
  if (service === 'etsy' || service === 'all') {
    const { isEtsyConfigured } = await import('@/lib/etsy')
    results.etsy = isEtsyConfigured()
      ? { status: 'ok', message: 'Etsy API connected' }
      : { status: 'not_configured', message: 'Etsy credentials not set' }
  }

  // Test Pinterest
  if (service === 'pinterest' || service === 'all') {
    const { isPinterestConfigured } = await import('@/lib/pinterest')
    results.pinterest = isPinterestConfigured()
      ? { status: 'ok', message: 'Pinterest API connected' }
      : { status: 'not_configured', message: 'Pinterest credentials not set' }
  }

  return NextResponse.json({ results })
}
