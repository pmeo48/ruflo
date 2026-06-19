import { NextResponse } from 'next/server'
import { trackClick } from '@/lib/affiliates'

export async function POST(req: Request) {
  try {
    const { code, productId } = await req.json()
    if (code) await trackClick(code, productId)
    return NextResponse.json({ tracked: true })
  } catch {
    return NextResponse.json({ tracked: false })
  }
}
