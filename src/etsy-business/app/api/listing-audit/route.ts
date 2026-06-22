import { NextRequest, NextResponse } from 'next/server'
import { auditListing } from '@/lib/listing-audit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title = '', description = '', tags = '', price = '', photoCount = '0' } = body

    if (!title && !description) {
      return NextResponse.json({ error: 'Provide at least a title or description to audit.' }, { status: 400 })
    }

    const result = await auditListing({ title, description, tags, price, photoCount })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
