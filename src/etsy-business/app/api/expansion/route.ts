import { NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()
    const product = MOCK_PRODUCTS.find(p => p.id === productId) ?? MOCK_PRODUCTS[0]
    const name = product.name.split(' ').slice(0, 2).join(' ')

    const ideas = [
      `${name} Lite Edition — Entry-level version`,
      `${name} Pro Edition — Advanced features`,
      `${name} Ultimate Bundle — Complete system`,
      `${name} for Beginners — Starter pack`,
      `${name} Industry Niche Edition`,
      `${name} Team Collaboration Version`,
      `${name} Done-For-You Templates`,
      `${name} Video Tutorial Add-on`,
      `${name} Swipe File Collection`,
      `${name} Email Sequence Bundle`,
      `${name} Social Proof Templates`,
      `${name} Case Study Collection`,
      `${name} ROI Calculator`,
      `${name} Project Management Add-on`,
      `${name} Client Onboarding Kit`,
      `${name} Proposal & Contract Templates`,
      `${name} Performance Tracker Dashboard`,
      `${name} Weekly Planning System`,
      `${name} Goal Setting Framework`,
      `${name} Launch Checklist Bundle`,
    ]

    return NextResponse.json({ ideas, productId, baseName: product.name })
  } catch {
    return NextResponse.json({ error: 'Expansion generation failed' }, { status: 500 })
  }
}
