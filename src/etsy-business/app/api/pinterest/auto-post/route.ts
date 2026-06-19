import { NextResponse } from 'next/server'
import { createPin, isPinterestConfigured } from '@/lib/pinterest'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const { productIds, storeUrl } = await req.json()
    const baseUrl = storeUrl || 'https://yourstore.com/store'

    const products = productIds?.length
      ? MOCK_PRODUCTS.filter((p) => productIds.includes(p.id))
      : MOCK_PRODUCTS

    if (!isPinterestConfigured()) {
      return NextResponse.json({
        success: true,
        demo: true,
        posted: products.map((p) => ({
          productId: p.id,
          pinId: `mock-${p.id}`,
          title: `${p.name} — AI-Powered Digital Toolkit`,
          status: 'demo',
        })),
        message: `Would post ${products.length} pins. Add Pinterest credentials to post real pins.`,
      })
    }

    const results = await Promise.allSettled(
      products.map((p) =>
        createPin({
          title: `${p.name} — AI-Powered ${p.type === 'prompt-pack' ? 'Prompt Pack' : 'Digital Toolkit'}`,
          description: `${p.description} Perfect for entrepreneurs and business owners. Instant digital download. ✨ Shop now →`,
          link: `${baseUrl}?utm_source=pinterest&utm_medium=pin&utm_campaign=${p.id}`,
          altText: p.name,
        })
      )
    )

    const posted = results.map((r, i) => ({
      productId: products[i].id,
      productName: products[i].name,
      status: r.status,
      pinId: r.status === 'fulfilled' ? (r.value as { id: string }).id : undefined,
      error: r.status === 'rejected' ? String(r.reason) : undefined,
    }))

    return NextResponse.json({ success: true, posted })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
