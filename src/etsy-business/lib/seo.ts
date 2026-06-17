import { SEOData, Keyword, Product } from './types'

export const ETSY_SEO_CONSTRAINTS = {
  maxTitleLength: 140,
  maxTags: 13,
  maxTagLength: 20,
  descriptionMinLength: 500,
  descriptionMaxLength: 10000,
}

export function buildSEOGenerationPrompt(product: {
  name: string
  description: string
  type: string
  tags?: string[]
}): string {
  return `You are an expert Etsy SEO specialist. Generate optimized SEO content for this Etsy digital product listing.

Product: ${product.name}
Description: ${product.description}
Type: ${product.type}
Existing Tags: ${product.tags?.join(', ') || 'none'}

IMPORTANT CONSTRAINTS:
- Title: Maximum 140 characters, include primary keyword near the front
- Tags: Exactly 13 tags, each max 20 characters, use long-tail keywords buyers search for
- Description: 500-2000 words, include keywords naturally, use line breaks for readability

Generate a JSON response:
{
  "title": "SEO-optimized title (max 140 chars)",
  "tags": ["tag1", "tag2", ...exactly 13 tags],
  "description": "Full listing description with sections: Overview, What's Included, Who This Is For, FAQ, CTA",
  "primaryKeyword": "main keyword",
  "score": 0-100
}`
}

export function buildKeywordResearchPrompt(niche: string): string {
  return `Generate a keyword research report for Etsy sellers in the "${niche}" niche.

Return a JSON array of 15 keywords:
[{
  "term": "keyword phrase",
  "searchVolume": estimated monthly searches (number),
  "competition": "low" | "medium" | "high",
  "relevanceScore": 0-100,
  "trend": "up" | "down" | "stable"
}]

Focus on:
- Long-tail keywords with buyer intent
- Etsy-specific search terms
- Keywords with low-medium competition
- Emerging trends in this niche`
}

export function scoreSEOTitle(title: string): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 100

  if (title.length > ETSY_SEO_CONSTRAINTS.maxTitleLength) {
    issues.push(`Title exceeds 140 characters (${title.length} chars)`)
    score -= 30
  }
  if (title.length < 60) {
    issues.push('Title is too short - expand with more keywords')
    score -= 15
  }
  if (!title.includes('|') && !title.includes('-') && !title.includes(',')) {
    issues.push('Consider adding keyword separators (| or ,) for better readability')
    score -= 5
  }

  return { score: Math.max(0, score), issues }
}
