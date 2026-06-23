import { NextRequest, NextResponse } from 'next/server'
import { generateFAQs } from '@/lib/faq'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { productName = '', description = '' } = await req.json()
    if (!productName.trim() && !description.trim()) {
      return NextResponse.json({ error: 'Provide at least a product name or description.' }, { status: 400 })
    }
    const result = await generateFAQs(productName.trim(), description.trim())
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
