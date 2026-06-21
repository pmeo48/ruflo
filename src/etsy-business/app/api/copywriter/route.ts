import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { generateCopy } from '@/lib/copywriter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, targetAudience } = body

    const product = MOCK_PRODUCTS.find((p) => p.id === productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const result = await generateCopy({
      productId: product.id,
      name: product.name,
      type: product.type,
      description: product.description,
      price: product.price,
      contents: product.contents,
      tags: product.tags,
      targetAudience,
    })

    return NextResponse.json({ copy: result })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
