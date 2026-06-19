import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing download token' }, { status: 400 })
  }

  try {
    // Decode token to get productId and timestamp
    const decoded = Buffer.from(token, 'base64url').toString()
    const [productId, tsStr] = decoded.split(':')
    const ts = Number(tsStr)

    // Token expires after 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - ts > sevenDays) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
    }

    // In production: redirect to a Supabase Storage signed URL for productId
    // For demo, return a placeholder response
    return NextResponse.json({
      message: 'Download ready',
      productId,
      note: 'Connect Supabase Storage to serve real files. This endpoint is wired and ready.',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid download token' }, { status: 400 })
  }
}
