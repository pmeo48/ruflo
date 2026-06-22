import { NextRequest, NextResponse } from 'next/server'
import { generateProductIdeas } from '@/lib/ideas'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche = '', audience = '', pricePoint = '', count = 5 } = body

    const ideas = await generateProductIdeas({
      niche,
      audience,
      pricePoint,
      count: Math.min(Math.max(Number(count) || 5, 1), 10),
    })

    return NextResponse.json({ ideas })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
