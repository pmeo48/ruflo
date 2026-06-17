import { NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { generateWithOpenAI } from '@/lib/openai'

function buildFallback(productName: string) {
  const name = productName.split(' ').slice(0, 2).join(' ')
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
  return { ideas }
}

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()
    const product = MOCK_PRODUCTS.find(p => p.id === productId) ?? MOCK_PRODUCTS[0]
    const productName = product.name
    const productType = product.type ?? 'pdf'

    const systemPrompt = 'You are an expert Etsy seller who specializes in creating product lines and derivative products that maximize revenue.'
    const userPrompt = `Generate 20 derivative product ideas from this base product: "${productName}" (${productType})

Create variations across these categories:
- Lite version (smaller scope, lower price)
- Pro version (expanded, higher price)
- Ultimate bundle version (comprehensive, premium price)
- 5 niche-specific versions for different industries
- 5 format variations (different product types)
- 7 adjacent topic expansions

Return JSON: {
  "derivatives": [{
    "name": "product name",
    "type": "lite|pro|ultimate|niche|format|expansion",
    "description": "one sentence",
    "price": 19,
    "targetNiche": "who it's for"
  }]
}
Return exactly 20 items. Only valid JSON.`

    try {
      const aiText = await generateWithOpenAI(systemPrompt, userPrompt)
      const parsed = JSON.parse(aiText)
      // Support both { derivatives: [...] } and { ideas: [...] } shapes
      if (parsed.derivatives) {
        const ideas = parsed.derivatives.map((d: { name: string }) => d.name)
        return NextResponse.json({ ideas, derivatives: parsed.derivatives, productId, baseName: productName })
      }
      return NextResponse.json({ ...parsed, productId, baseName: productName })
    } catch {
      // Fall through to template fallback
    }

    const fallback = buildFallback(productName)
    return NextResponse.json({ ...fallback, productId, baseName: productName })
  } catch {
    return NextResponse.json({ error: 'Expansion generation failed' }, { status: 500 })
  }
}
