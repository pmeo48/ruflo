import { Product } from './types'
import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'

export interface PriceAnalysis {
  productId: string
  productName: string
  currentPrice: number
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  confidence: 'high' | 'medium' | 'low'
  reason: string
  expectedRevenueChange: number  // percentage
  marketPosition: 'underpriced' | 'competitive' | 'overpriced'
  competitorAvgPrice: number
  elasticityScore: number  // 0-10, higher = more price sensitive
  strategy: 'penetration' | 'premium' | 'competitive' | 'value'
  insights: string[]
  createdAt: string
}

export interface PricingStrategy {
  name: string
  description: string
  targetMargin: number
  priceMultiplier: number
}

export const PRICING_STRATEGIES: PricingStrategy[] = [
  {
    name: 'Penetration',
    description: 'Low price to capture market share quickly',
    targetMargin: 0.6,
    priceMultiplier: 0.75,
  },
  {
    name: 'Competitive',
    description: 'Match market average — safe and balanced',
    targetMargin: 0.75,
    priceMultiplier: 1.0,
  },
  {
    name: 'Value',
    description: 'Slightly above average with strong perceived value',
    targetMargin: 0.8,
    priceMultiplier: 1.2,
  },
  {
    name: 'Premium',
    description: 'Top-tier pricing for authority positioning',
    targetMargin: 0.9,
    priceMultiplier: 1.5,
  },
]

// Rule-based price recommendations (demo mode)
function deriveAnalysis(product: Product): PriceAnalysis {
  const convRate = product.conversionRate
  const salesVelocity = product.sales

  // Determine market position from conversion rate
  let marketPosition: PriceAnalysis['marketPosition']
  let strategy: PriceAnalysis['strategy']
  let recommendedPrice = product.price
  let expectedRevenueChange = 0
  let reason = ''
  let competitorAvgPrice = product.price * 1.1

  if (convRate < 0.8) {
    // Low conversion — likely overpriced or poor positioning
    marketPosition = 'overpriced'
    strategy = 'competitive'
    recommendedPrice = Math.round(product.price * 0.85 / 5) * 5
    expectedRevenueChange = 18
    reason = `Low conversion rate (${convRate.toFixed(2)}%) suggests the price may be deterring buyers. A 15% reduction could significantly boost volume.`
    competitorAvgPrice = product.price * 0.9
  } else if (convRate > 2.5 && salesVelocity > 100) {
    // High conversion and good sales — room to increase price
    marketPosition = 'underpriced'
    strategy = 'value'
    recommendedPrice = Math.round(product.price * 1.25 / 5) * 5
    expectedRevenueChange = 22
    reason = `Strong conversion rate (${convRate.toFixed(2)}%) and high sales volume indicate strong demand. The market will support a higher price point.`
    competitorAvgPrice = product.price * 1.3
  } else {
    // Well-priced
    marketPosition = 'competitive'
    strategy = 'competitive'
    recommendedPrice = product.price
    expectedRevenueChange = 0
    reason = `Current pricing is well-calibrated for the market. Conversion rate of ${convRate.toFixed(2)}% is healthy. Maintain current price.`
    competitorAvgPrice = product.price * 1.05
  }

  const elasticityScore = convRate > 2 ? 3 : convRate > 1 ? 5 : 8

  const insights = [
    `${product.views.toLocaleString()} views with ${product.sales} sales = ${convRate.toFixed(2)}% conversion`,
    `${product.favorites} favorites suggests strong wishlist intent`,
    competitorAvgPrice > product.price
      ? `Competitors average $${competitorAvgPrice.toFixed(0)} — you have pricing headroom`
      : `You are priced above competitor average of $${competitorAvgPrice.toFixed(0)}`,
    strategy === 'value'
      ? 'High review score supports premium positioning'
      : 'Consider A/B testing adjacent price points ($1-5 increments)',
  ]

  return {
    productId: product.id,
    productName: product.name,
    currentPrice: product.price,
    recommendedPrice,
    minPrice: Math.max(7, Math.round(product.price * 0.6 / 5) * 5),
    maxPrice: Math.round(product.price * 2 / 5) * 5,
    confidence: convRate > 1.5 ? 'high' : convRate > 0.8 ? 'medium' : 'low',
    reason,
    expectedRevenueChange,
    marketPosition,
    competitorAvgPrice,
    elasticityScore,
    strategy,
    insights,
    createdAt: new Date().toISOString(),
  }
}

export async function analyzePricing(product: Product): Promise<PriceAnalysis> {
  const systemPrompt = `You are an expert Etsy pricing strategist specializing in digital products.
Analyze the provided product data and return a JSON pricing recommendation.

Return ONLY valid JSON matching this exact structure:
{
  "recommendedPrice": number,
  "minPrice": number,
  "maxPrice": number,
  "confidence": "high" | "medium" | "low",
  "reason": "string (2-3 sentences)",
  "expectedRevenueChange": number (percentage, can be negative),
  "marketPosition": "underpriced" | "competitive" | "overpriced",
  "competitorAvgPrice": number,
  "elasticityScore": number (0-10),
  "strategy": "penetration" | "premium" | "competitive" | "value",
  "insights": ["string", "string", "string", "string"]
}`

  const userPrompt = `Analyze pricing for this digital product:

Name: ${product.name}
Type: ${product.type}
Current Price: $${product.price}
Compare At Price: ${product.compareAtPrice ? `$${product.compareAtPrice}` : 'none'}
Category: ${product.category} / ${product.subcategory}
Tags: ${product.tags.join(', ')}

Performance Metrics:
- Total Views: ${product.views.toLocaleString()}
- Total Sales: ${product.sales}
- Conversion Rate: ${product.conversionRate}%
- Total Revenue: $${product.revenue}
- Favorites: ${product.favorites}
- Avg Rating: ${product.avgRating ?? 'N/A'} (${product.reviewCount} reviews)

Provide a pricing recommendation based on Etsy market dynamics for digital products in this niche.`

  try {
    let raw: string
    try {
      raw = await generateWithOpenAI(systemPrompt, userPrompt)
    } catch {
      raw = await generateWithClaude(systemPrompt, userPrompt)
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    const parsed = JSON.parse(jsonMatch[0])

    return {
      productId: product.id,
      productName: product.name,
      currentPrice: product.price,
      recommendedPrice: parsed.recommendedPrice,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
      confidence: parsed.confidence,
      reason: parsed.reason,
      expectedRevenueChange: parsed.expectedRevenueChange,
      marketPosition: parsed.marketPosition,
      competitorAvgPrice: parsed.competitorAvgPrice,
      elasticityScore: parsed.elasticityScore,
      strategy: parsed.strategy,
      insights: parsed.insights,
      createdAt: new Date().toISOString(),
    }
  } catch {
    return deriveAnalysis(product)
  }
}

export async function analyzePricingBatch(products: Product[]): Promise<PriceAnalysis[]> {
  return Promise.all(products.map(analyzePricing))
}
