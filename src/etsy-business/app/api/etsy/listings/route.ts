import { NextResponse } from 'next/server'
import { createEtsyListing, getEtsyShopListings, isEtsyConfigured } from '@/lib/etsy'

export async function GET() {
  if (!isEtsyConfigured()) {
    return NextResponse.json({
      listings: [],
      configured: false,
      message: 'Etsy API not configured. Add ETSY_API_KEY, ETSY_SHOP_ID, and ETSY_ACCESS_TOKEN to .env.local',
    })
  }
  try {
    const data = await getEtsyShopListings()
    return NextResponse.json({ listings: data.results ?? [], configured: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { productId, title, description, price, tags } = await req.json()
    if (!isEtsyConfigured()) {
      return NextResponse.json({
        listing_id: `mock-${productId}-${Date.now()}`,
        state: 'draft',
        configured: false,
        message: 'Mock listing created. Configure Etsy API to push to your real shop.',
      })
    }
    const listing = await createEtsyListing({
      title: title.slice(0, 140),
      description,
      price,
      quantity: 999,
      tags: tags.slice(0, 13).map((t: string) => t.slice(0, 20)),
      materials: ['Digital Download', 'PDF'],
      type: 'download',
      is_digital: true,
    })
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
