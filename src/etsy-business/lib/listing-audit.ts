import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'

export interface ListingScore {
  overall: number
  title: number
  tags: number
  description: number
  pricing: number
  photos: number
}

export interface AuditFinding {
  category: 'title' | 'tags' | 'description' | 'pricing' | 'photos' | 'general'
  severity: 'critical' | 'warning' | 'tip'
  issue: string
  fix: string
}

export interface ListingAuditResult {
  scores: ListingScore
  findings: AuditFinding[]
  optimizedTitle: string
  suggestedTags: string[]
  summary: string
}

export interface ListingAuditInput {
  title: string
  description: string
  tags: string
  price: string
  photoCount: string
}

function scoreTitle(title: string): { score: number; findings: AuditFinding[] } {
  const findings: AuditFinding[] = []
  let score = 100

  if (title.length < 40) {
    score -= 30
    findings.push({
      category: 'title',
      severity: 'critical',
      issue: `Title is only ${title.length} characters. Etsy allows 140 — you're leaving visibility on the table.`,
      fix: 'Expand your title to 120–140 characters using long-tail keyword phrases buyers actually search.',
    })
  } else if (title.length < 80) {
    score -= 15
    findings.push({
      category: 'title',
      severity: 'warning',
      issue: `Title is ${title.length} characters. You have room to add more keywords.`,
      fix: 'Add 2–3 more keyword phrases (product type, use case, audience) to reach 120+ characters.',
    })
  }

  if (title === title.toUpperCase()) {
    score -= 10
    findings.push({
      category: 'title',
      severity: 'warning',
      issue: 'Title is all caps, which looks spammy and reduces click-through rate.',
      fix: 'Use Title Case instead — capitalize the first letter of each important word.',
    })
  }

  if (/[!@#$%^&*]{2,}/.test(title)) {
    score -= 10
    findings.push({
      category: 'title',
      severity: 'warning',
      issue: 'Multiple special characters detected — Etsy may penalize this in search.',
      fix: 'Remove special characters and use natural keyword phrases instead.',
    })
  }

  const keywordCount = title.split(/[\s,|]+/).filter((w) => w.length > 3).length
  if (keywordCount < 5) {
    score -= 20
    findings.push({
      category: 'title',
      severity: 'critical',
      issue: 'Title contains too few keywords. Etsy ranks listings based on keyword match.',
      fix: 'Include the primary keyword first, then 4–6 secondary keywords: product type, style, occasion, recipient, format.',
    })
  }

  return { score: Math.max(0, score), findings }
}

function scoreTags(tags: string): { score: number; findings: AuditFinding[]; tagList: string[] } {
  const tagList = tags.split(/[,\n]+/).map((t) => t.trim()).filter(Boolean)
  const findings: AuditFinding[] = []
  let score = 100

  if (tagList.length < 5) {
    score -= 40
    findings.push({
      category: 'tags',
      severity: 'critical',
      issue: `Only ${tagList.length} tags provided. Etsy allows 13 — each unused tag is lost search traffic.`,
      fix: 'Fill all 13 tag slots with unique, multi-word phrases buyers use to search.',
    })
  } else if (tagList.length < 10) {
    score -= 20
    findings.push({
      category: 'tags',
      severity: 'warning',
      issue: `Using ${tagList.length}/13 tags. Add ${13 - tagList.length} more to maximize reach.`,
      fix: 'Add long-tail variations: audience + use case, occasion + format, niche + style.',
    })
  }

  const singleWordTags = tagList.filter((t) => !t.includes(' '))
  if (singleWordTags.length > 2) {
    score -= 15
    findings.push({
      category: 'tags',
      severity: 'warning',
      issue: `${singleWordTags.length} single-word tags detected (${singleWordTags.slice(0, 3).join(', ')}). Single words are highly competitive.`,
      fix: 'Replace single-word tags with 2–3 word phrases that match how buyers actually search.',
    })
  }

  const duplicateWords = tagList.filter((tag) =>
    tagList.filter((t) => t.toLowerCase() !== tag.toLowerCase()).some((t) =>
      t.toLowerCase().includes(tag.toLowerCase().split(' ')[0])
    )
  )
  if (duplicateWords.length > 3) {
    score -= 10
    findings.push({
      category: 'tags',
      severity: 'tip',
      issue: 'Some tags share the same root word. Etsy already combines tag variations.',
      fix: 'Use each tag slot to target a completely different search concept.',
    })
  }

  return { score: Math.max(0, score), findings, tagList }
}

function scoreDescription(description: string): { score: number; findings: AuditFinding[] } {
  const findings: AuditFinding[] = []
  let score = 100
  const wordCount = description.split(/\s+/).filter(Boolean).length

  if (wordCount < 100) {
    score -= 35
    findings.push({
      category: 'description',
      severity: 'critical',
      issue: `Description is only ${wordCount} words. Short descriptions convert poorly and miss SEO.`,
      fix: 'Write 200–500 words covering: what\'s included, who it\'s for, how to use it, and FAQ.',
    })
  } else if (wordCount < 200) {
    score -= 15
    findings.push({
      category: 'description',
      severity: 'warning',
      issue: `Description is ${wordCount} words. Expanding to 250+ words improves SEO and conversions.`,
      fix: 'Add a "What\'s Included" section, customer FAQs, and a clear call to action.',
    })
  }

  if (!description.toLowerCase().includes('instant') && !description.toLowerCase().includes('download') && !description.toLowerCase().includes('digital')) {
    score -= 15
    findings.push({
      category: 'description',
      severity: 'warning',
      issue: 'Description doesn\'t clearly state this is a digital/instant download product.',
      fix: 'Add "Instant Digital Download" near the top. Buyers need to know delivery method immediately.',
    })
  }

  if (!description.includes('\n') && wordCount > 50) {
    score -= 10
    findings.push({
      category: 'description',
      severity: 'tip',
      issue: 'Description appears to be one long block of text with no formatting.',
      fix: 'Use line breaks, bullet points (★ or •), and section headers to improve readability.',
    })
  }

  if (!/(buy|purchase|get|order|add to cart)/i.test(description)) {
    score -= 10
    findings.push({
      category: 'description',
      severity: 'tip',
      issue: 'No clear call to action found in description.',
      fix: 'End with "Click \'Add to Cart\' to get instant access" or similar purchase prompt.',
    })
  }

  return { score: Math.max(0, score), findings }
}

function scorePricing(price: string): { score: number; findings: AuditFinding[] } {
  const findings: AuditFinding[] = []
  let score = 85
  const num = parseFloat(price.replace(/[^0-9.]/g, ''))

  if (isNaN(num)) return { score: 70, findings: [] }

  if (num < 5) {
    score -= 30
    findings.push({
      category: 'pricing',
      severity: 'critical',
      issue: `$${num} is below the minimum viable price for digital products on Etsy.`,
      fix: 'Digital products should be priced $9.99 minimum. Low price signals low quality to buyers.',
    })
  } else if (num < 9) {
    score -= 15
    findings.push({
      category: 'pricing',
      severity: 'warning',
      issue: `$${num} may be underpriced. Buyers often perceive low-priced digital products as low value.`,
      fix: 'Consider pricing at $9.99 or higher. Test $14.99 to see if conversion rate holds.',
    })
  } else if (num > 100) {
    score -= 10
    findings.push({
      category: 'pricing',
      severity: 'tip',
      issue: `$${num} is above average for digital downloads. Buyers may hesitate without social proof.`,
      fix: 'Add reviews/testimonials to listing, or offer a lower-tier version as an entry point.',
    })
  }

  const str = String(num)
  if (!str.includes('.99') && !str.includes('.97') && !str.includes('.95')) {
    findings.push({
      category: 'pricing',
      severity: 'tip',
      issue: 'Price doesn\'t use charm pricing (e.g. $17.99 vs $18).',
      fix: 'Charm pricing (ending in .99 or .97) can improve conversion rates by 5–10%.',
    })
    score -= 5
  }

  return { score: Math.max(0, score), findings }
}

function scorePhotos(photoCount: string): { score: number; findings: AuditFinding[] } {
  const count = parseInt(photoCount) || 0
  const findings: AuditFinding[] = []
  let score = 100

  if (count === 0) {
    score = 30
    findings.push({
      category: 'photos',
      severity: 'critical',
      issue: 'No photo count provided. Listings with fewer photos rank lower in search.',
      fix: 'Add 5–10 images: mockups showing the product in use, preview pages, before/after, and a lifestyle shot.',
    })
  } else if (count < 3) {
    score -= 40
    findings.push({
      category: 'photos',
      severity: 'critical',
      issue: `Only ${count} photo(s). Etsy allows 10 — listings with more photos get more clicks.`,
      fix: 'Add product mockups (PDFs on a desk, phone, iPad), a contents preview, and a lifestyle context image.',
    })
  } else if (count < 6) {
    score -= 20
    findings.push({
      category: 'photos',
      severity: 'warning',
      issue: `${count} photos. Aim for 7–10 to maximize visual appeal and search ranking.`,
      fix: 'Add: a "What\'s Included" graphic, a before/after mockup, and a testimonial quote image.',
    })
  }

  return { score: Math.max(0, score), findings }
}

function buildFallbackAudit(input: ListingAuditInput): ListingAuditResult {
  const titleResult = scoreTitle(input.title)
  const tagsResult = scoreTags(input.tags)
  const descResult = scoreDescription(input.description)
  const priceResult = scorePricing(input.price)
  const photoResult = scorePhotos(input.photoCount)

  const scores: ListingScore = {
    title: titleResult.score,
    tags: tagsResult.score,
    description: descResult.score,
    pricing: priceResult.score,
    photos: photoResult.score,
    overall: Math.round(
      (titleResult.score * 0.3 + tagsResult.score * 0.25 + descResult.score * 0.2 + priceResult.score * 0.1 + photoResult.score * 0.15)
    ),
  }

  const allFindings = [
    ...titleResult.findings,
    ...tagsResult.findings,
    ...descResult.findings,
    ...priceResult.findings,
    ...photoResult.findings,
  ]

  const tagList = tagsResult.tagList
  const suggestedTags = tagList.length < 13
    ? [...tagList, 'digital download', 'instant download', 'printable template', 'editable pdf', 'small business tool'].slice(0, 13)
    : tagList

  const optimizedTitle = input.title.length < 100 && input.title
    ? `${input.title} | Digital Download Template | Instant Access PDF for Small Business`
    : input.title

  const criticalCount = allFindings.filter((f) => f.severity === 'critical').length
  const summary = criticalCount > 0
    ? `Found ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} that are likely hurting your search ranking and conversions. Address these first.`
    : `Your listing looks solid. Apply the tips below to squeeze out more visibility and conversion rate.`

  return { scores, findings: allFindings, optimizedTitle, suggestedTags, summary }
}

export async function auditListing(input: ListingAuditInput): Promise<ListingAuditResult> {
  const base = buildFallbackAudit(input)

  const prompt = `You are an expert Etsy SEO consultant. Audit this Etsy digital product listing and return ONLY a JSON object (no markdown, no explanation).

Listing:
Title: ${input.title}
Tags: ${input.tags}
Description: ${input.description.slice(0, 800)}
Price: ${input.price}
Photo count: ${input.photoCount}

Return this exact JSON structure:
{
  "optimizedTitle": "<improved title 120-140 chars>",
  "suggestedTags": ["<tag1>", "<tag2>", ..., "<tag13>"],
  "summary": "<2 sentence overall assessment>",
  "additionalFindings": [
    {"category": "title|tags|description|pricing|photos", "severity": "critical|warning|tip", "issue": "<specific problem>", "fix": "<specific action>"}
  ]
}`

  try {
    const text = await generateWithOpenAI(prompt, 'Audit this listing and return only valid JSON.')
    if (text) {
      const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
      return {
        ...base,
        optimizedTitle: json.optimizedTitle || base.optimizedTitle,
        suggestedTags: json.suggestedTags || base.suggestedTags,
        summary: json.summary || base.summary,
        findings: [...base.findings, ...(json.additionalFindings || [])],
      }
    }
  } catch {}

  try {
    const text = await generateWithClaude(prompt, 'Audit this listing and return only valid JSON.')
    if (text) {
      const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
      return {
        ...base,
        optimizedTitle: json.optimizedTitle || base.optimizedTitle,
        suggestedTags: json.suggestedTags || base.suggestedTags,
        summary: json.summary || base.summary,
        findings: [...base.findings, ...(json.additionalFindings || [])],
      }
    }
  } catch {}

  return base
}
