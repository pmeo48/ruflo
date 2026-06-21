import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'
import { ProductType } from './types'

export interface CopyVariant {
  id: string
  label: string
  headline: string
  subheadline: string
  bullets: string[]
  description: string
  cta: string
  tone: string
}

export interface GeneratedCopy {
  productId: string
  productName: string
  productType: ProductType
  variants: CopyVariant[]
  etsyDescription: string
  emailTeaser: string
  socialCaption: string
  createdAt: string
}

const TONE_PRESETS = [
  { id: 'professional', label: 'Professional', description: 'Authoritative, credible, results-focused' },
  { id: 'friendly', label: 'Friendly', description: 'Warm, approachable, conversational' },
  { id: 'urgency', label: 'Urgency', description: 'FOMO-driven, limited-time, action-oriented' },
  { id: 'storytelling', label: 'Storytelling', description: 'Narrative arc, relatable problem, transformation' },
]

export { TONE_PRESETS }

const SYSTEM_PROMPT = `You are an elite direct-response copywriter specializing in Etsy digital products.
You write high-converting copy that speaks directly to buyer pain points and desires.

Rules:
- Lead with the transformation, not the features
- Use power words that trigger emotion
- Be specific with numbers and outcomes
- Keep bullets scannable (8-12 words max each)
- Etsy descriptions: 1500-2000 chars, no markdown, use line breaks

Return ONLY valid JSON matching this structure exactly:
{
  "variants": [
    {
      "id": "professional",
      "label": "Professional",
      "headline": "string (max 80 chars)",
      "subheadline": "string (max 120 chars)",
      "bullets": ["string x6-8, each starting with emoji"],
      "description": "string (150-200 words, compelling sales paragraph)",
      "cta": "string (max 60 chars)",
      "tone": "professional"
    },
    {
      "id": "friendly",
      "label": "Friendly",
      "headline": "...",
      "subheadline": "...",
      "bullets": [...],
      "description": "...",
      "cta": "...",
      "tone": "friendly"
    },
    {
      "id": "urgency",
      "label": "Urgency",
      "headline": "...",
      "subheadline": "...",
      "bullets": [...],
      "description": "...",
      "cta": "...",
      "tone": "urgency"
    }
  ],
  "etsyDescription": "string (full Etsy listing description, 1500-2000 chars, plain text with line breaks)",
  "emailTeaser": "string (2-3 sentence email preview, 60-80 words)",
  "socialCaption": "string (Instagram/Pinterest caption with 5-7 hashtags, 80-120 words)"
}`

function buildUserPrompt(params: {
  name: string
  type: ProductType
  description: string
  price: number
  contents: string[]
  tags: string[]
  targetAudience?: string
}): string {
  return `Write conversion copy for this digital product:

PRODUCT: ${params.name}
TYPE: ${params.type}
PRICE: $${params.price}
DESCRIPTION: ${params.description}
CONTENTS: ${params.contents.join(', ')}
TAGS/KEYWORDS: ${params.tags.join(', ')}
${params.targetAudience ? `TARGET AUDIENCE: ${params.targetAudience}` : ''}

Generate 3 copy variants (professional, friendly, urgency), a full Etsy listing description, an email teaser, and a social caption.`
}

// Fallback copy when AI is not configured
function buildFallbackCopy(params: {
  name: string
  type: ProductType
  description: string
  price: number
  contents: string[]
  tags: string[]
}): GeneratedCopy {
  const firstName = params.name.split(' ').slice(0, 3).join(' ')

  const variants: CopyVariant[] = [
    {
      id: 'professional',
      label: 'Professional',
      headline: `The Complete ${firstName} System`,
      subheadline: `Everything you need to get results — organized, proven, and ready to deploy today.`,
      bullets: [
        `✅ ${params.contents[0] ?? 'Comprehensive templates and frameworks'}`,
        `✅ ${params.contents[1] ?? 'Step-by-step implementation guides'}`,
        `✅ ${params.contents[2] ?? 'Proven strategies from industry experts'}`,
        `✅ Instant digital delivery — start in minutes`,
        `✅ Lifetime access with free future updates`,
        `✅ 30-day money-back guarantee`,
      ],
      description: `${params.description} This comprehensive resource gives you everything you need to hit the ground running. Whether you're just getting started or looking to scale what's working, this toolkit delivers real, measurable results.`,
      cta: `Get Instant Access — $${params.price}`,
      tone: 'professional',
    },
    {
      id: 'friendly',
      label: 'Friendly',
      headline: `Finally — a ${params.type.replace('-', ' ')} that actually works`,
      subheadline: `No fluff, no filler. Just the good stuff you'll actually use.`,
      bullets: [
        `🙌 ${params.contents[0] ?? 'Ready-to-use from day one'}`,
        `💡 ${params.contents[1] ?? 'Clear, jargon-free instructions'}`,
        `🚀 ${params.contents[2] ?? 'Designed for real people, not robots'}`,
        `⚡ Instant download after purchase`,
        `🔄 Updated regularly with new content`,
        `❤️ Loved by hundreds of customers`,
      ],
      description: `Hey! So glad you found this. I made ${params.name} because I was tired of piecing together solutions from a dozen different places. Everything you need is right here in one clean, organized package. You're going to love it.`,
      cta: `Yes! I want this — $${params.price}`,
      tone: 'friendly',
    },
    {
      id: 'urgency',
      label: 'Urgency',
      headline: `Stop Losing Time & Money Without This`,
      subheadline: `Every day without ${firstName} is another day behind your competition.`,
      bullets: [
        `🔥 ${params.contents[0] ?? 'Immediate competitive advantage'}`,
        `⏰ Save 10+ hours per week starting today`,
        `💰 Pays for itself with the first use`,
        `🎯 ${params.contents[1] ?? 'Laser-focused on your specific results'}`,
        `📈 Trusted by hundreds of professionals`,
        `⚡ Download instantly — no waiting`,
      ],
      description: `While you're reading this, your competitors are already using tools like ${params.name} to get ahead. At $${params.price}, this isn't a cost — it's an investment that pays back immediately. Don't let another week go by without this in your toolkit.`,
      cta: `Get It Now Before the Price Goes Up`,
      tone: 'urgency',
    },
  ]

  const etsyDescription = `${params.description}

WHAT'S INCLUDED:
${params.contents.map((c) => `• ${c}`).join('\n')}

WHO IS THIS FOR:
This ${params.type.replace('-', ' ')} is perfect for professionals, entrepreneurs, and anyone looking to save time and get better results with AI-powered tools.

HOW IT WORKS:
1. Purchase and download instantly
2. Open in your preferred app
3. Customize to your needs
4. Start getting results

INSTANT DIGITAL DELIVERY:
This is a digital product. You'll receive your download link immediately after purchase. No physical product will be shipped.

KEYWORDS: ${params.tags.join(', ')}

Questions? Message me anytime — I respond within 24 hours!`

  return {
    productId: '',
    productName: params.name,
    productType: params.type,
    variants,
    etsyDescription,
    emailTeaser: `Grab ${params.name} and start seeing results today. This ${params.type.replace('-', ' ')} includes everything you need: ${params.contents.slice(0, 3).join(', ')}, and much more. For just $${params.price}, it's the best investment you'll make this month.`,
    socialCaption: `Just dropped: ${params.name} 🚀 Everything you need to level up with AI-powered tools. Includes ${params.contents.slice(0, 2).join(' + ')} and more. Only $${params.price} — link in bio! ${params.tags.slice(0, 5).map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')}`,
    createdAt: new Date().toISOString(),
  }
}

export async function generateCopy(params: {
  productId: string
  name: string
  type: ProductType
  description: string
  price: number
  contents: string[]
  tags: string[]
  targetAudience?: string
}): Promise<GeneratedCopy> {
  const userPrompt = buildUserPrompt(params)

  try {
    let raw: string
    try {
      raw = await generateWithOpenAI(SYSTEM_PROMPT, userPrompt, 'gpt-4o-mini')
    } catch {
      raw = await generateWithClaude(SYSTEM_PROMPT, userPrompt)
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])

    return {
      productId: params.productId,
      productName: params.name,
      productType: params.type,
      variants: parsed.variants ?? [],
      etsyDescription: parsed.etsyDescription ?? '',
      emailTeaser: parsed.emailTeaser ?? '',
      socialCaption: parsed.socialCaption ?? '',
      createdAt: new Date().toISOString(),
    }
  } catch {
    return { ...buildFallbackCopy(params), productId: params.productId }
  }
}
