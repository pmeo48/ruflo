import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'

export interface ProductIdea {
  id: string
  title: string
  description: string
  targetAudience: string
  priceRange: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  potentialRevenue: string
  tags: string[]
  whyItWorks: string
}

export interface IdeaGenerationParams {
  niche: string
  audience: string
  pricePoint: string
  count: number
}

const FALLBACK_IDEAS: Record<string, ProductIdea[]> = {
  default: [
    {
      id: '1',
      title: 'AI Prompt Library for Content Creators',
      description: 'A curated collection of 500+ ChatGPT and Claude prompts organized by content type — blog posts, social captions, email sequences, and video scripts.',
      targetAudience: 'Freelance writers, social media managers, content agencies',
      priceRange: '$17–$27',
      difficulty: 'Easy',
      potentialRevenue: '$800–$2,400/mo',
      tags: ['AI prompts', 'content creation', 'productivity', 'ChatGPT'],
      whyItWorks: 'High demand, low competition, evergreen topic with repeat buyers wanting updates.',
    },
    {
      id: '2',
      title: 'Notion CRM Template for Freelancers',
      description: 'Complete client relationship management system built in Notion — pipeline tracking, invoice logging, follow-up reminders, and onboarding checklists.',
      targetAudience: 'Freelancers, consultants, solo agencies',
      priceRange: '$19–$37',
      difficulty: 'Medium',
      potentialRevenue: '$1,200–$3,600/mo',
      tags: ['Notion template', 'CRM', 'freelancer', 'client management'],
      whyItWorks: 'Notion templates are top-selling on Etsy; CRM niche has buyers with money.',
    },
    {
      id: '3',
      title: 'Digital Product Launch Checklist Bundle',
      description: '5 detailed checklists covering product research, listing optimization, launch marketing, post-launch review strategy, and scaling — 80+ action items total.',
      targetAudience: 'New Etsy sellers, digital entrepreneurs',
      priceRange: '$9–$15',
      difficulty: 'Easy',
      potentialRevenue: '$500–$1,800/mo',
      tags: ['checklist', 'Etsy seller', 'digital product launch', 'printable'],
      whyItWorks: 'Low price = high conversion; serves the growing market of new Etsy sellers.',
    },
    {
      id: '4',
      title: 'Email Marketing Swipe File for Coaches',
      description: '30 done-for-you email templates covering welcome sequences, nurture campaigns, launch sequences, and cart abandonment — editable in Canva and Google Docs.',
      targetAudience: 'Business coaches, life coaches, course creators',
      priceRange: '$27–$47',
      difficulty: 'Medium',
      potentialRevenue: '$1,500–$4,500/mo',
      tags: ['email templates', 'coaching', 'marketing', 'swipe file'],
      whyItWorks: 'Coaches are a high-spending audience; done-for-you saves them hours every week.',
    },
    {
      id: '5',
      title: 'Social Media Content Calendar (6 Months)',
      description: 'Pre-planned 180-day content calendar with daily post ideas, caption frameworks, hashtag clusters, and story prompts for Instagram, TikTok, and Pinterest.',
      targetAudience: 'Small business owners, brand managers, virtual assistants',
      priceRange: '$12–$22',
      difficulty: 'Easy',
      potentialRevenue: '$700–$2,100/mo',
      tags: ['content calendar', 'social media', 'Instagram', 'small business'],
      whyItWorks: 'Evergreen demand; buyers return seasonally for updated calendars.',
    },
  ],
}

function buildFallbackIdeas(params: IdeaGenerationParams): ProductIdea[] {
  const base = FALLBACK_IDEAS.default.slice(0, params.count)
  return base.map((idea, i) => ({
    ...idea,
    id: String(i + 1),
    targetAudience: params.audience || idea.targetAudience,
  }))
}

function parseIdeasFromText(text: string): ProductIdea[] {
  const ideas: ProductIdea[] = []
  const blocks = text.split(/\n(?=\d+\.\s|\*\*\d+\.)/).filter(Boolean)

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const titleMatch = block.match(/(?:\d+\.\s+\*?\*?)([^\n*]+)/)?.[1]?.trim()
    if (!titleMatch) continue

    const desc = block.match(/(?:Description|What it is)[:\s]+([^\n]+)/i)?.[1]?.trim()
    const audience = block.match(/(?:Audience|Target)[:\s]+([^\n]+)/i)?.[1]?.trim()
    const price = block.match(/(?:Price|Pricing)[:\s]+([^\n]+)/i)?.[1]?.trim()
    const revenue = block.match(/(?:Revenue|Potential)[:\s]+([^\n]+)/i)?.[1]?.trim()
    const why = block.match(/(?:Why it works|Why)[:\s]+([^\n]+)/i)?.[1]?.trim()
    const tagsMatch = block.match(/(?:Tags|Keywords)[:\s]+([^\n]+)/i)?.[1]
    const tags = tagsMatch ? tagsMatch.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : []

    ideas.push({
      id: String(i + 1),
      title: titleMatch,
      description: desc || 'A high-value digital product for your target market.',
      targetAudience: audience || 'Digital entrepreneurs',
      priceRange: price || '$17–$37',
      difficulty: 'Medium',
      potentialRevenue: revenue || '$500–$2,000/mo',
      tags,
      whyItWorks: why || 'Strong market demand with proven buyer intent on Etsy.',
    })
  }

  return ideas.length > 0 ? ideas : []
}

export async function generateProductIdeas(params: IdeaGenerationParams): Promise<ProductIdea[]> {
  const prompt = `You are an expert Etsy digital product strategist. Generate ${params.count} unique, profitable digital product ideas for the following criteria:

Niche: ${params.niche || 'general digital products'}
Target Audience: ${params.audience || 'entrepreneurs and small business owners'}
Price Point Preference: ${params.pricePoint || 'mid-range ($15–$45)'}

For each idea, provide:
1. **Title** — Clear, marketable product name
   Description: 1-2 sentence description of what the product contains
   Audience: Specific target buyer persona
   Price: Recommended price range
   Revenue: Realistic monthly revenue potential at moderate volume
   Difficulty: Easy / Medium / Hard (to create)
   Tags: 5 Etsy-optimized search tags
   Why it works: 1 sentence on why this sells well

Focus on digital products that:
- Solve a specific, painful problem
- Have proven demand on Etsy or similar platforms
- Can be delivered instantly as PDFs, templates, spreadsheets, or Notion docs
- Are differentiated from generic offerings

Be specific and creative — avoid generic titles.`

  try {
    const text = await generateWithOpenAI(prompt, 'Generate the ideas now.', 'gpt-4o-mini')
    if (text) {
      const parsed = parseIdeasFromText(text)
      if (parsed.length >= 2) return parsed.slice(0, params.count)
    }
  } catch {}

  try {
    const text = await generateWithClaude(prompt, 'Generate the ideas now.')
    if (text) {
      const parsed = parseIdeasFromText(text)
      if (parsed.length >= 2) return parsed.slice(0, params.count)
    }
  } catch {}

  return buildFallbackIdeas(params)
}
