import { NextRequest, NextResponse } from 'next/server'
import { getTests, createTest, ABTestMetric, ABVariantType } from '@/lib/abtesting'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tests = await getTests()
    return NextResponse.json({ tests })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const test = await createTest({
      name: body.name,
      productId: body.productId,
      metric: body.metric as ABTestMetric,
      variants: body.variants as { type: ABVariantType; value: string }[],
      notes: body.notes,
    })
    return NextResponse.json({ test })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
