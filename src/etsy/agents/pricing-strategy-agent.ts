import Anthropic from '@anthropic-ai/sdk';
import type { Product, PriceRecommendation, Niche } from '../types';

type ClaudePrice = Omit<PriceRecommendation, 'productId' | 'marginPercent'>;

const FALLBACK_PRICES: Record<string, number> = {
  printable: 3.99,
  svg: 2.99,
  template: 6.99,
  planner: 5.99,
  'wall-art': 4.99,
  'digital-paper': 3.49,
  font: 8.99,
  mockup: 7.99,
};

export class PricingStrategyAgent {
  constructor(private client: Anthropic) {}

  private readonly LISTING_FEE = 0.2;
  private readonly TRANSACTION_FEE_RATE = 0.065;

  async recommendPrice(
    product: Product,
    niche?: Niche,
  ): Promise<PriceRecommendation> {
    const nicheContext = niche
      ? `Niche: ${niche.name}\nAverage niche price: $${niche.avgPrice}\nCompetition: ${niche.competitionLevel}\nSearch volume: ${niche.searchVolume}`
      : `Niche: ${product.niche}`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:
        'You are an Etsy pricing strategist. Recommend optimal prices for digital products based on market data and competition.',
      messages: [
        {
          role: 'user',
          content: `Recommend a price for this Etsy digital product. Return ONLY raw JSON with no markdown or code blocks.\n\nProduct type: ${product.type}\n${nicheContext}\n\nReturn a JSON object with these exact fields:\n- recommendedPrice: number\n- minPrice: number\n- maxPrice: number\n- competitorRange: { "low": number, "high": number }\n- promotionStrategy: string`,
        },
      ],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const parsed = JSON.parse(rawText) as ClaudePrice;
      return {
        productId: product.id,
        recommendedPrice: parsed.recommendedPrice,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        competitorRange: parsed.competitorRange,
        marginPercent: this.calculateMargin(parsed.recommendedPrice),
        promotionStrategy: parsed.promotionStrategy,
      };
    } catch {
      const base = FALLBACK_PRICES[product.type] ?? 4.99;
      return {
        productId: product.id,
        recommendedPrice: base,
        minPrice: Math.max(0.99, +(base * 0.6).toFixed(2)),
        maxPrice: +(base * 2.2).toFixed(2),
        competitorRange: {
          low: +(base * 0.5).toFixed(2),
          high: +(base * 3).toFixed(2),
        },
        marginPercent: this.calculateMargin(base),
        promotionStrategy: `Launch at $${(base * 0.8).toFixed(2)} for first 30 days, then raise to $${base}. Offer 20% off coupon during holidays.`,
      };
    }
  }

  async recommendPrices(
    products: Product[],
    niches?: Niche[],
  ): Promise<PriceRecommendation[]> {
    const results: PriceRecommendation[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const niche = niches?.find((n) => n.name === product.niche);
      results.push(await this.recommendPrice(product, niche));
    }
    return results;
  }

  private calculateMargin(price: number): number {
    const netRevenue =
      price - this.LISTING_FEE - price * this.TRANSACTION_FEE_RATE;
    return Math.round((netRevenue / price) * 100);
  }
}
