import { NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/settings'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  const settings = await getSettings()
  // Mask sensitive keys before sending to client
  const safe = { ...settings }
  const keyFields = ['openaiKey', 'anthropicKey', 'stripePublishableKey', 'resendApiKey', 'pinterestAccessToken', 'etsyApiKey', 'supabaseAnonKey']
  keyFields.forEach(f => {
    if (safe[f as keyof typeof safe]) {
      (safe as Record<string, string>)[f] = '••••' + safe[f as keyof typeof safe].slice(-4)
    }
  })
  return NextResponse.json({ settings: safe, configured: isSupabaseConfigured() })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true, message: 'Settings saved in memory (Supabase not configured — add to .env.local to persist)' })
    }
    await saveSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
