import Anthropic from '@anthropic-ai/sdk';
import type { EtsyListing, PriceRecommendation, ListingMetrics, GrowthReport } from '../types';

export class AnalyticsAgent {
  constructor(private client: Anthropic) {}

  simulateMetrics(listings: EtsyListing[], prices: PriceRecommendation[]): ListingMetrics[] {
    const seed = (str: string) => str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (min: number, max: number, s: number) => min + (s % (max - min + 1));

    return listings.map((listing) => {
      const s = seed(listing.productId);
      const priceRec = prices.find((p) => p.productId === listing.productId);
      const price = priceRec?.recommendedPrice ?? 9.99;

      const views = rng(50, 500, s * 7);
      const clicks = Math.floor(views * (rng(5, 20, s * 11) / 100));
      const conversions = Math.floor(clicks * (rng(1, 8, s * 13) / 100));
      const revenue = parseFloat((conversions * price).toFixed(2));
      const reviewCount = rng(0, conversions, s * 17);
      const avgRating = parseFloat((4.2 + (rng(0, 80, s * 19) / 100)).toFixed(1));

      return {
        listingId: `listing-${listing.productId}`,
        productId: listing.productId,
        views,
        clicks,
        conversions,
        revenue,
        reviewCount,
        avgRating,
        period: 'last-30-days',
      };
    });
  }

  async generateGrowthReport(metrics: ListingMetrics[], listings: EtsyListing[]): Promise<GrowthReport> {
    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = parseFloat(metrics.reduce((sum, m) => sum + m.revenue, 0).toFixed(2));

    const sorted = [...metrics].sort((a, b) => b.revenue - a.revenue);
    const top3 = sorted.slice(0, 3).map((m) => {
      const listing = listings.find((l) => l.productId === m.productId);
      return listing?.title ?? m.productId;
    });

    const summary = {
      totalViews,
      totalClicks,
      totalConversions,
      totalRevenue,
      top3ListingsByRevenue: top3,
    };

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are an Etsy analytics expert. Analyze store performance data and provide actionable growth recommendations.',
        messages: [
          {
            role: 'user',
            content: `Analyze this Etsy store performance data and return a raw JSON GrowthReport object:\n\n${JSON.stringify(summary, null, 2)}\n\nReturn only valid JSON with this exact structure:\n{\n  "topPerformers": ["listing title 1", "listing title 2"],\n  "underperformers": ["listing title 3"],\n  "totalRevenue": 123.45,\n  "totalOrders": 10,\n  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]\n}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        topPerformers: string[];
        underperformers: string[];
        totalRevenue: number;
        totalOrders: number;
        recommendations: string[];
      };

      return {
        period: 'last-30-days',
        topPerformers: parsed.topPerformers ?? [],
        underperformers: parsed.underperformers ?? [],
        totalRevenue: parsed.totalRevenue ?? totalRevenue,
        totalOrders: parsed.totalOrders ?? totalConversions,
        recommendations: parsed.recommendations ?? [],
        generatedAt: new Date(),
      };
    } catch {
      return {
        period: 'last-30-days',
        topPerformers: top3.slice(0, 2),
        underperformers: top3.length > 2 ? [top3[top3.length - 1]] : [],
        totalRevenue,
        totalOrders: totalConversions,
        recommendations: [
          'Optimize listing titles with high-search keywords',
          'Add more product images to boost conversion rates',
          'Consider promotional pricing during peak seasons',
        ],
        generatedAt: new Date(),
      };
    }
  }
}
