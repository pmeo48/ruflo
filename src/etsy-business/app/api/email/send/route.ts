import { NextResponse } from 'next/server'
import { sendMarketingEmail, isEmailConfigured } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { to, subject, htmlBody, previewText } = await req.json()

    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo mode: Add RESEND_API_KEY to .env.local to send real emails',
        preview: { to, subject, previewText },
      })
    }

    const result = await sendMarketingEmail({ to, subject, htmlBody, previewText })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
