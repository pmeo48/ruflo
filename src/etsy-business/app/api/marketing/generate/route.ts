import { NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { generateWithOpenAI } from '@/lib/openai'

function buildFallback(platform: string, productName: string, description: string, salesCopy?: string) {
  const content: Record<string, unknown> = {
    pinterest: {
      pins: [
        { title: `Pin: ${productName}`, description: `${salesCopy ?? description}`.slice(0, 150), hashtags: ['#aitools', '#etsyseller', '#passiveincome', '#digitalproducts', '#sidehustle'] },
        { title: `Why You Need ${productName}`, description: `Save time and grow your business with this digital download.`, hashtags: ['#entrepreneur', '#aitools', '#digitalproducts', '#passiveincome', '#business'] },
        { title: `${productName} — Instant Download`, description: `The top AI toolkit for digital entrepreneurs. Get it now!`, hashtags: ['#etsydigital', '#aitools', '#sidehustle', '#passiveincome', '#business'] },
      ],
    },
    blog: {
      title: `How ${productName} Can Transform Your Business`,
      intro: `In this post we dive into how ${productName} helps entrepreneurs save time and make more money. Here's what's included and why thousands of business owners love it.`,
      sections: [
        { heading: 'What Is It?', content: description },
        { heading: 'Key Benefits', content: 'Save 10+ hours per week, automate repetitive tasks, and grow revenue with AI.' },
        { heading: 'Who Is It For?', content: 'Entrepreneurs, freelancers, and small business owners ready to leverage AI.' },
      ],
      conclusion: `${productName} is a must-have digital product for anyone serious about growing their business with AI. Get your copy today.`,
      metaDescription: `${productName} — the ultimate AI toolkit for entrepreneurs. Save time, increase productivity, and grow revenue.`.slice(0, 155),
    },
    email: {
      emails: [
        { subject: `Introducing ${productName}`, preview: 'Your new AI secret weapon is here', body: `Hey [First Name],\n\nExcited to share the ${productName} with you.\n\n${description}\n\nGet it here → [LINK]\n\nBest,\n[Your Name]` },
        { subject: `Still thinking about ${productName}?`, preview: 'Here\'s what\'s inside', body: `Hey [First Name],\n\nJust wanted to follow up on ${productName}.\n\nHere's what you get: ${salesCopy ?? description}\n\nGrab yours today → [LINK]\n\n[Your Name]` },
        { subject: `Last chance: ${productName}`, preview: 'Don\'t miss out', body: `Hey [First Name],\n\nThis is your final reminder about ${productName}.\n\nDon't miss out on the tools that top entrepreneurs use every day.\n\n→ [LINK]\n\n[Your Name]` },
      ],
    },
    social: {
      facebook: `${salesCopy ?? description}\n\n${productName} — available now as an instant digital download! Link in comments.`,
      instagram: `${salesCopy ?? description} ✨\n\n${productName} is here! Tap the link in bio to grab yours. 🚀 #digitalproducts #aitools #passiveincome #entrepreneur`,
      linkedin: `Excited to share ${productName} — a comprehensive AI toolkit designed for modern entrepreneurs. ${description} Available now as an instant digital download.`,
      twitter: `${productName} — ${(salesCopy ?? description).slice(0, 200)} Get it now! 🚀`,
    },
  }
  return content[platform] ?? content['social']
}

export async function POST(req: Request) {
  try {
    const { productId, platform } = await req.json()
    const product = MOCK_PRODUCTS.find(p => p.id === productId) ?? MOCK_PRODUCTS[0]
    const productName = product.name
    const description = product.description ?? ''
    const salesCopy = product.salesCopy

    const systemPrompt = 'You are an expert content marketer specializing in Etsy digital products and AI business tools. Create engaging content that drives traffic and sales.'

    const userPromptMap: Record<string, string> = {
      pinterest: `Create 3 Pinterest pins for this Etsy product: "${productName}"
Return JSON: { "pins": [{ "title": "pin title", "description": "150-char description", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] }, ...] }`,
      blog: `Create an SEO blog article outline for: "${productName}"
Return JSON: { "title": "SEO title", "intro": "2-sentence intro", "sections": [{"heading": "h2", "content": "paragraph"}], "conclusion": "closing paragraph", "metaDescription": "155-char meta" }`,
      email: `Create a 3-email sequence for: "${productName}"
Return JSON: { "emails": [{ "subject": "subject line", "preview": "preview text", "body": "email body (3-4 short paragraphs)" }, ...] }`,
      social: `Create social posts for: "${productName}"
Return JSON: { "facebook": "post text", "instagram": "caption with emojis", "linkedin": "professional post", "twitter": "tweet under 280 chars" }`,
    }

    const userPrompt = userPromptMap[platform] ?? userPromptMap['social']

    try {
      const aiText = await generateWithOpenAI(systemPrompt, userPrompt)
      const parsed = JSON.parse(aiText)
      return NextResponse.json(parsed)
    } catch {
      // Fall through to template fallback
    }

    return NextResponse.json(buildFallback(platform, productName, description, salesCopy))
  } catch {
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
