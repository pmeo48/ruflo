import { NextResponse } from 'next/server'
import { publishEtsyListing, updateEtsyListing, deleteEtsyListing, isEtsyConfigured } from '@/lib/etsy'

export async function PATCH(req: Request, { params }: { params: { listingId: string } }) {
  if (!isEtsyConfigured()) {
    return NextResponse.json({ success: true, mock: true, message: 'Mock update — Etsy not configured' })
  }
  try {
    const body = await req.json()
    const { action, ...data } = body
    if (action === 'publish') {
      const result = await publishEtsyListing(params.listingId)
      return NextResponse.json(result)
    }
    const result = await updateEtsyListing(params.listingId, data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { listingId: string } }) {
  if (!isEtsyConfigured()) {
    return NextResponse.json({ success: true, mock: true })
  }
  try {
    await deleteEtsyListing(params.listingId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
