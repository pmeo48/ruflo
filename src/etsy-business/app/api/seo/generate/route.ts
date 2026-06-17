import { NextResponse } from 'next/server'
import { generateWithOpenAI } from '@/lib/openai'

function buildFallback(productName: string, productType: string) {
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
  return {
    title: title.slice(0, 140),
    tags,
    description,
    category: 'Templates',
    subcategory: 'Business Templates',
    keywords: baseKeywords.concat(['AI tools', 'digital products', 'entrepreneur', 'passive income', 'business']).slice(0, 10),
  }
}

export async function POST(req: Request) {
  try {
    const { productName, productType, niche } = await req.json()

    const systemPrompt = 'You are an expert Etsy SEO specialist who optimizes listings for maximum search visibility and sales conversion.'
    const userPrompt = `Generate optimized Etsy SEO for this digital product:
Product: ${productName}
Type: ${productType}
Niche: ${niche || 'general business'}

Return JSON with these exact fields:
{
  "title": "SEO-optimized Etsy title (max 140 characters, include top keywords naturally)",
  "tags": ["tag1", "tag2", ...],
  "description": "Full Etsy listing description (400-600 words) including: hook paragraph, 5-7 bullet features, benefits section, who it's for, FAQ with 3 Q&As, and strong CTA",
  "category": "best Etsy category (e.g. 'Craft Supplies & Tools')",
  "subcategory": "best subcategory",
  "keywords": ["keyword1", ...]
}
Return only valid JSON, no markdown.`

    try {
      const aiText = await generateWithOpenAI(systemPrompt, userPrompt)
      const parsed = JSON.parse(aiText)
      return NextResponse.json(parsed)
    } catch {
      // Fall through to template fallback
    }

    return NextResponse.json(buildFallback(productName, productType))
  } catch {
    return NextResponse.json({ error: 'SEO generation failed' }, { status: 500 })
  }
}
