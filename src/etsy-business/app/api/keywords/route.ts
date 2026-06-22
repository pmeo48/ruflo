import { NextRequest, NextResponse } from 'next/server'
import { researchKeywords } from '@/lib/keywords'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { seed } = await req.json()
    if (!seed || typeof seed !== 'string' || seed.trim().length < 2) {
      return NextResponse.json({ error: 'Provide a seed keyword (at least 2 characters).' }, { status: 400 })
    }
    const result = await researchKeywords(seed.trim())
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
