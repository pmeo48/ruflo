import Anthropic from '@anthropic-ai/sdk';

export interface TrendingProduct {
  title: string;
  niche: string;
  estimatedMonthlySearches: number;
  competitionScore: number;
  avgPrice: number;
  opportunityScore: number;
  keywords: string[];
  productTypes: string[];
}

export interface DailyTrendReport {
  date: string;
  trending: TrendingProduct[];
  hotNiches: string[];
  decliningNiches: string[];
  emergingOpportunities: string[];
  recommendedActions: string[];
}

const RESEARCH_SYSTEM =
  'You are an Etsy market research expert specializing in AI tools and productivity digital products. Analyze trends and provide data-driven insights.';

function stripFences(text: string): string {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
}

const FALLBACK_REPORT: DailyTrendReport = {
  date: '',
  trending: [],
  hotNiches: [],
  decliningNiches: [],
  emergingOpportunities: [],
  recommendedActions: [],
};

export class EtsyResearchAgent {
  constructor(private client: Anthropic) {}

  async getDailyTrends(focusAreas?: string[]): Promise<DailyTrendReport> {
    const areas = focusAreas ?? [
      'ChatGPT prompts',
      'AI guides',
      'productivity planners',
      'AI cheat sheets',
      'AI for beginners',
    ];
    const date = new Date().toISOString().split('T')[0];

    const prompt = `Analyze current Etsy marketplace trends for these focus areas: ${areas.join(', ')}.

Return raw JSON only (no markdown) matching this exact structure:
{
  "date": "${date}",
  "trending": [
    {
      "title": "500 ChatGPT Prompts for Entrepreneurs",
      "niche": "ChatGPT prompts",
      "estimatedMonthlySearches": 12000,
      "competitionScore": 4,
      "avgPrice": 7.99,
      "opportunityScore": 82,
      "keywords": ["chatgpt prompts", "ai prompts", "entrepreneur prompts"],
      "productTypes": ["prompt-pack", "digital download"]
    }
  ],
  "hotNiches": ["ChatGPT prompts", "AI writing tools"],
  "decliningNiches": ["generic printables", "basic SVGs"],
  "emergingOpportunities": ["AI image generation prompts", "GPT-4 business templates"],
  "recommendedActions": ["Create prompt packs targeting entrepreneurs", "Bundle AI guides with cheat sheets"]
}

Include exactly 5 TrendingProduct entries. competitionScore is 1-10 (lower = less competition). opportunityScore is 0-100.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: RESEARCH_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') return { ...FALLBACK_REPORT, date };

      const parsed = JSON.parse(stripFences(block.text)) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return { ...FALLBACK_REPORT, date };

      return parsed as DailyTrendReport;
    } catch {
      return { ...FALLBACK_REPORT, date };
    }
  }

  async analyzeCategoryOpportunity(category: string): Promise<TrendingProduct[]> {
    const prompt = `Analyze Etsy marketplace opportunities specifically in the "${category}" category.

Return raw JSON only (no markdown) — an array of exactly 5 TrendingProduct objects:
[
  {
    "title": "Example Product Title",
    "niche": "${category}",
    "estimatedMonthlySearches": 8000,
    "competitionScore": 3,
    "avgPrice": 6.99,
    "opportunityScore": 78,
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "productTypes": ["guide", "digital download"]
  }
]

competitionScore: 1-10 (lower = less competition). opportunityScore: 0-100. Return only the JSON array.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: RESEARCH_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') return [];

      const parsed = JSON.parse(stripFences(block.text)) as unknown;
      if (!Array.isArray(parsed)) return [];

      return parsed as TrendingProduct[];
    } catch {
      return [];
    }
  }

  async getCompetitorInsights(productType: string): Promise<{
    topSellerTitles: string[];
    avgPrice: number;
    priceRange: { low: number; high: number };
    commonKeywords: string[];
    marketGaps: string[];
  }> {
    const fallback = {
      topSellerTitles: [],
      avgPrice: 0,
      priceRange: { low: 0, high: 0 },
      commonKeywords: [],
      marketGaps: [],
    };

    const prompt = `Analyze the competitive landscape for "${productType}" digital products on Etsy.

Return raw JSON only (no markdown) matching this structure:
{
  "topSellerTitles": ["Top Seller Title 1", "Top Seller Title 2", "Top Seller Title 3"],
  "avgPrice": 8.99,
  "priceRange": { "low": 2.99, "high": 24.99 },
  "commonKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "marketGaps": ["Gap opportunity 1", "Gap opportunity 2", "Gap opportunity 3"]
}

Provide realistic, data-driven estimates based on typical Etsy market patterns. Return only the JSON object.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: RESEARCH_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') return fallback;

      const parsed = JSON.parse(stripFences(block.text)) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return fallback;

      return parsed as typeof fallback;
    } catch {
      return fallback;
    }
  }
}
