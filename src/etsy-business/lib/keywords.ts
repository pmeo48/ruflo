import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'

export interface KeywordData {
  keyword: string
  searchVolume: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low'
  competition: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low'
  opportunity: number // 0-100
  trend: 'Rising' | 'Stable' | 'Declining'
  avgPrice: string
  listingCount: string
  buyerIntent: 'High' | 'Medium' | 'Low'
  tags: string[]
}

export interface KeywordResearchResult {
  seed: string
  keywords: KeywordData[]
  topOpportunities: string[]
  insights: string[]
  titleSnippets: string[]
}

const COMPETITION_MAP: Record<string, number> = {
  'Very High': 10,
  'High': 30,
  'Medium': 50,
  'Low': 75,
  'Very Low': 90,
}

const VOLUME_MAP: Record<string, number> = {
  'Very High': 90,
  'High': 70,
  'Medium': 50,
  'Low': 25,
  'Very Low': 10,
}

function computeOpportunity(volume: string, competition: string): number {
  const v = VOLUME_MAP[volume] ?? 50
  const c = COMPETITION_MAP[competition] ?? 50
  return Math.round((v * 0.6 + c * 0.4))
}

const SEED_EXPANSIONS: Record<string, Partial<KeywordData>[]> = {
  default: [
    { keyword: '{seed} template', searchVolume: 'High', competition: 'Medium', trend: 'Rising', buyerIntent: 'High', avgPrice: '$14–$27', listingCount: '2,400', tags: ['template', 'printable', 'editable'] },
    { keyword: '{seed} digital download', searchVolume: 'High', competition: 'Low', trend: 'Rising', buyerIntent: 'High', avgPrice: '$9–$19', listingCount: '1,100', tags: ['digital download', 'instant access', 'pdf'] },
    { keyword: '{seed} printable', searchVolume: 'Medium', competition: 'Medium', trend: 'Stable', buyerIntent: 'High', avgPrice: '$5–$12', listingCount: '5,800', tags: ['printable', 'instant download', 'planner'] },
    { keyword: '{seed} workbook', searchVolume: 'Medium', competition: 'Low', trend: 'Rising', buyerIntent: 'High', avgPrice: '$17–$35', listingCount: '780', tags: ['workbook', 'pdf', 'self-paced'] },
    { keyword: '{seed} spreadsheet', searchVolume: 'Medium', competition: 'Low', trend: 'Rising', buyerIntent: 'High', avgPrice: '$12–$24', listingCount: '920', tags: ['spreadsheet', 'google sheets', 'excel template'] },
    { keyword: '{seed} planner', searchVolume: 'Very High', competition: 'Very High', trend: 'Stable', buyerIntent: 'Medium', avgPrice: '$7–$15', listingCount: '18,000', tags: ['planner', 'printable planner', 'daily planner'] },
    { keyword: '{seed} checklist', searchVolume: 'Medium', competition: 'Low', trend: 'Stable', buyerIntent: 'High', avgPrice: '$5–$9', listingCount: '3,200', tags: ['checklist', 'printable list', 'task tracker'] },
    { keyword: '{seed} guide pdf', searchVolume: 'Low', competition: 'Very Low', trend: 'Rising', buyerIntent: 'High', avgPrice: '$15–$37', listingCount: '340', tags: ['guide', 'how-to', 'ebook'] },
    { keyword: 'small business {seed}', searchVolume: 'Medium', competition: 'Medium', trend: 'Rising', buyerIntent: 'High', avgPrice: '$17–$29', listingCount: '1,600', tags: ['small business', 'entrepreneur', 'startup'] },
    { keyword: '{seed} for beginners', searchVolume: 'Low', competition: 'Very Low', trend: 'Rising', buyerIntent: 'High', avgPrice: '$12–$22', listingCount: '280', tags: ['beginner guide', 'starter kit', 'learn'] },
  ],
}

function buildFallbackKeywords(seed: string): KeywordData[] {
  const templates = SEED_EXPANSIONS.default
  return templates.map((t) => {
    const keyword = (t.keyword ?? '').replace(/\{seed\}/g, seed)
    const opp = computeOpportunity(t.searchVolume ?? 'Medium', t.competition ?? 'Medium')
    return {
      keyword,
      searchVolume: t.searchVolume ?? 'Medium',
      competition: t.competition ?? 'Medium',
      opportunity: opp,
      trend: t.trend ?? 'Stable',
      avgPrice: t.avgPrice ?? '$15–$25',
      listingCount: t.listingCount ?? '1,000',
      buyerIntent: t.buyerIntent ?? 'Medium',
      tags: (t.tags ?? []).map((tag) => tag.replace(/\{seed\}/g, seed)),
    } as KeywordData
  })
}

function buildInsights(keywords: KeywordData[], seed: string): string[] {
  const insights: string[] = []
  const highOpp = keywords.filter((k) => k.opportunity >= 70)
  const rising = keywords.filter((k) => k.trend === 'Rising')

  if (highOpp.length > 0) {
    insights.push(`${highOpp.length} keyword${highOpp.length > 1 ? 's' : ''} have high opportunity scores — low competition relative to search demand.`)
  }
  if (rising.length > 0) {
    insights.push(`${rising.length} rising trend keyword${rising.length > 1 ? 's' : ''} detected — ideal for listing optimization now before competition catches up.`)
  }

  const avgPrice = keywords
    .map((k) => parseFloat(k.avgPrice.replace(/[^0-9]/g, '')))
    .filter(Boolean)
  if (avgPrice.length > 0) {
    const avg = Math.round(avgPrice.reduce((a, b) => a + b, 0) / avgPrice.length)
    insights.push(`Average market price across this niche is ~$${avg}. Price your product within this range to stay competitive.`)
  }

  insights.push(`Long-tail "${seed} digital download" and "${seed} template" keywords convert better than broad single-word terms.`)
  insights.push(`Combine your top 3 opportunity keywords into your listing title for maximum search coverage.`)

  return insights
}

function buildTitleSnippets(seed: string, keywords: KeywordData[]): string[] {
  const top = keywords
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, 5)
    .map((k) => k.keyword)

  return [
    `${seed.charAt(0).toUpperCase() + seed.slice(1)} Template | Digital Download | ${top[0] ?? seed + ' PDF'}`,
    `Printable ${seed.charAt(0).toUpperCase() + seed.slice(1)} | ${top[1] ?? seed + ' Planner'} | Instant Access`,
    `${seed.charAt(0).toUpperCase() + seed.slice(1)} Workbook PDF | ${top[2] ?? 'Small Business ' + seed} | Editable Template`,
  ]
}

function parseKeywordsFromText(text: string, seed: string): KeywordData[] | null {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed) || parsed.length < 3) return null
    return parsed.map((k: Record<string, unknown>, i: number) => ({
      keyword: String(k.keyword ?? seed),
      searchVolume: (k.searchVolume as KeywordData['searchVolume']) ?? 'Medium',
      competition: (k.competition as KeywordData['competition']) ?? 'Medium',
      opportunity: computeOpportunity(String(k.searchVolume ?? 'Medium'), String(k.competition ?? 'Medium')),
      trend: (k.trend as KeywordData['trend']) ?? 'Stable',
      avgPrice: String(k.avgPrice ?? '$15–$25'),
      listingCount: String(k.listingCount ?? '1,000'),
      buyerIntent: (k.buyerIntent as KeywordData['buyerIntent']) ?? 'Medium',
      tags: Array.isArray(k.tags) ? (k.tags as string[]) : [],
    }))
  } catch {
    return null
  }
}

export async function researchKeywords(seed: string): Promise<KeywordResearchResult> {
  const prompt = `You are an Etsy SEO expert. Research keyword opportunities for the seed keyword: "${seed}"

Generate 10 keyword variations that Etsy buyers actually search for. For each keyword, estimate:
- searchVolume: Very High | High | Medium | Low | Very Low
- competition: Very High | High | Medium | Low | Very Low
- trend: Rising | Stable | Declining
- avgPrice: typical price range on Etsy (e.g. "$14–$27")
- listingCount: approximate number of competing listings (e.g. "2,400")
- buyerIntent: High | Medium | Low
- tags: 3 related Etsy tags

Return ONLY a JSON array, no markdown:
[{"keyword":"...","searchVolume":"...","competition":"...","trend":"...","avgPrice":"...","listingCount":"...","buyerIntent":"...","tags":["...","...","..."]}]`

  let keywords = buildFallbackKeywords(seed)

  try {
    const text = await generateWithOpenAI(prompt, 'Return only the JSON array.')
    if (text) {
      const parsed = parseKeywordsFromText(text, seed)
      if (parsed) keywords = parsed
    }
  } catch {}

  if (keywords === buildFallbackKeywords(seed)) {
    try {
      const text = await generateWithClaude(prompt, 'Return only the JSON array.')
      if (text) {
        const parsed = parseKeywordsFromText(text, seed)
        if (parsed) keywords = parsed
      }
    } catch {}
  }

  keywords.sort((a, b) => b.opportunity - a.opportunity)

  return {
    seed,
    keywords,
    topOpportunities: keywords.filter((k) => k.opportunity >= 65).map((k) => k.keyword).slice(0, 5),
    insights: buildInsights(keywords, seed),
    titleSnippets: buildTitleSnippets(seed, keywords),
  }
}
