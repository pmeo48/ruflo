import { NextRequest, NextResponse } from 'next/server'
import { GenerateSEORequest } from '@/lib/types'
import { buildSEOGenerationPrompt, scoreSEOTitle } from '@/lib/seo'

function generateMockSEO(productName: string, productType: string) {
  const typeKeywords: Record<string, string[]> = {
    'prompt-pack': ['ai prompts', 'chatgpt prompts', 'prompt pack', 'ai tools', 'digital download'],
    pdf: ['pdf guide', 'digital download', 'printable', 'business guide', 'ebook'],
    spreadsheet: ['google sheets', 'excel template', 'spreadsheet', 'tracker', 'dashboard'],
    notion: ['notion template', 'notion workspace', 'productivity template', 'notion database'],
    bundle: ['digital bundle', 'business bundle', 'complete kit', 'bundle deal'],
  }

  const keywords = typeKeywords[productType] || typeKeywords['prompt-pack']
  const shortName = productName.length > 60 ? productName.slice(0, 60) : productName

  const title = `${shortName} | ${keywords[0]} | Instant Download Digital Product`
  const tags = [
    ...keywords.slice(0, 5),
    'instant download',
    'digital product',
    'small business',
    'entrepreneur',
    'ai business',
    'productivity',
    'templates',
  ].slice(0, 13)

  const description = `✨ WHAT YOU GET
${productName}

This comprehensive digital product is designed to help entrepreneurs and business owners achieve more in less time using the power of AI.

📦 WHAT'S INCLUDED
• Complete system with step-by-step instructions
• Ready-to-use templates you can customize immediately
• Bonus resources to accelerate your results

💡 WHO THIS IS FOR
✓ Entrepreneurs ready to scale their business
✓ Professionals looking to save time with AI
✓ Business owners wanting proven systems
✓ Anyone wanting to leverage AI for growth

⚡ HOW IT WORKS
1. Purchase and instantly download
2. Follow the quick-start guide
3. Customize for your specific needs
4. Start seeing results immediately

❓ FAQ
Q: Is this compatible with ChatGPT & Claude?
A: Yes! Works with all major AI tools.

Q: Do I need technical skills?
A: No! Everything is beginner-friendly with clear instructions.

Q: Can I use this for client work?
A: Yes! For personal and professional use.

🎯 INSTANT DOWNLOAD - No waiting. Start using immediately after purchase.

Questions? Message us anytime. We respond within 24 hours.`

  const { score } = scoreSEOTitle(title)

  return { title, tags, description, score: Math.min(score + 15, 95), primaryKeyword: keywords[0] }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSEORequest = await request.json()
    const { productName, productType } = body

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY

    if (apiKey && !apiKey.includes('placeholder')) {
      const prompt = buildSEOGenerationPrompt({
        name: productName,
        description: body.productDescription,
        type: productType,
      })
      // In production: call AI API with prompt
    }

    const seoData = generateMockSEO(productName, productType)
    return NextResponse.json(seoData)
  } catch (error) {
    console.error('SEO generation error:', error)
    return NextResponse.json({ error: 'Failed to generate SEO' }, { status: 500 })
  }
}
