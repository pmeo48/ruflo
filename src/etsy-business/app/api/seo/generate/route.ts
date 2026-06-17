import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { productName, productType } = await req.json()

    const typeKeywords: Record<string, string[]> = {
      pdf: ['pdf guide', 'ebook', 'digital guide', 'how to guide'],
      spreadsheet: ['spreadsheet template', 'excel template', 'google sheets'],
      notion: ['notion template', 'notion workspace', 'productivity template'],
      'prompt-pack': ['ChatGPT prompts', 'AI prompts', 'prompt pack', 'AI templates'],
      bundle: ['bundle', 'mega pack', 'complete system'],
    }

    const baseKeywords = typeKeywords[productType] ?? typeKeywords['prompt-pack']
    const nameWords = productName.toLowerCase().split(' ').slice(0, 3).join(' ')

    const title = `${productName} | AI-Powered ${productType === 'prompt-pack' ? 'Prompt Pack' : 'Digital Template'} | Instant Download | ChatGPT Templates`

    const tags = [
      ...baseKeywords,
      nameWords,
      'AI business tools',
      'digital download',
      'business templates',
      'entrepreneur tools',
      'passive income',
      'ChatGPT',
    ].slice(0, 13)

    const description = `Supercharge your business with the ${productName}. This comprehensive AI-powered digital product includes everything you need to save time, increase productivity, and grow your revenue.\n\n✅ WHAT'S INCLUDED:\n• Complete step-by-step system\n• AI-optimized templates and prompts\n• Instant digital download\n• Lifetime access and free updates\n\n⭐ PERFECT FOR:\nEntrepreneurs, small business owners, and professionals who want to leverage AI to work smarter.\n\n💡 WHY CUSTOMERS LOVE IT:\n"This saved me 10+ hours per week!" - Verified Buyer\n\n📥 INSTANT DOWNLOAD after purchase. No physical product will be shipped.`

    return NextResponse.json({
      title: title.slice(0, 140),
      tags,
      description,
      category: 'Templates',
      subcategory: 'Business Templates',
    })
  } catch {
    return NextResponse.json({ error: 'SEO generation failed' }, { status: 500 })
  }
}
