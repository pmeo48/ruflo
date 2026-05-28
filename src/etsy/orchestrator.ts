import Anthropic from '@anthropic-ai/sdk';
import type {
  EtsyBusinessState,
  MarketReport,
  Product,
  EtsyListing,
  PriceRecommendation,
  ListingMetrics,
  GrowthReport,
} from './types.js';
import { SessionStore } from './session-store.js';
import { MarketResearchAgent } from './agents/market-research-agent.js';
import { ProductCreatorAgent } from './agents/product-creator-agent.js';
import { ListingOptimizerAgent } from './agents/listing-optimizer-agent.js';
import { PricingStrategyAgent } from './agents/pricing-strategy-agent.js';
import { AnalyticsAgent } from './agents/analytics-agent.js';

interface RunOptions {
  niche?: string;
  productCount?: number;
}

interface SummaryRow {
  label: string;
  count: number;
  detail: string;
}

function formatTable(rows: SummaryRow[]): string {
  const colWidths = [30, 8, 50];
  const divider = colWidths.map(w => '-'.repeat(w)).join('-+-');
  const header = [
    'Label'.padEnd(colWidths[0]),
    'Count'.padEnd(colWidths[1]),
    'Detail'.padEnd(colWidths[2]),
  ].join(' | ');

  const body = rows
    .map(r =>
      [
        r.label.padEnd(colWidths[0]),
        String(r.count).padEnd(colWidths[1]),
        r.detail.slice(0, colWidths[2]).padEnd(colWidths[2]),
      ].join(' | ')
    )
    .join('\n');

  return [header, divider, body].join('\n');
}

export class EtsyOrchestrator {
  private readonly client: Anthropic;
  private readonly store: SessionStore;
  private readonly agents: {
    market: MarketResearchAgent;
    creator: ProductCreatorAgent;
    listing: ListingOptimizerAgent;
    pricing: PricingStrategyAgent;
    analytics: AnalyticsAgent;
  };

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env['ANTHROPIC_API_KEY'];
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: key });
    this.store = new SessionStore();

    this.agents = {
      market: new MarketResearchAgent(this.client),
      creator: new ProductCreatorAgent(this.client),
      listing: new ListingOptimizerAgent(this.client),
      pricing: new PricingStrategyAgent(this.client),
      analytics: new AnalyticsAgent(this.client),
    };
  }

  async run(opts: RunOptions = {}): Promise<void> {
    const productCount = opts.productCount ?? 3;
    let state = this.store.load();

    let marketReport: MarketReport | undefined;
    try {
      console.log('[orchestrator] step 1/5 — market research');
      marketReport = await this.agents.market.research(
        opts.niche ? { focusNiche: opts.niche } : undefined
      );
      state = this.store.update({ lastMarketReport: marketReport });
    } catch (err) {
      console.error('[orchestrator] market research failed:', err);
    }

    let newProducts: Product[] = [];
    if (marketReport) {
      try {
        console.log('[orchestrator] step 2/5 — product creation');
        newProducts = await this.agents.creator.createProducts(marketReport, productCount);
        state = this.store.update({ products: [...state.products, ...newProducts] });
      } catch (err) {
        console.error('[orchestrator] product creation failed:', err);
      }
    }

    let newListings: EtsyListing[] = [];
    if (newProducts.length > 0) {
      try {
        console.log('[orchestrator] step 3/5 — listing optimization');
        newListings = [];
        for (const product of newProducts) {
          try {
            const listing = await this.agents.listing.optimizeListing(product);
            newListings.push(listing);
          } catch (err) {
            console.error(`[orchestrator] listing failed for ${product.id}:`, err);
          }
        }
        state = this.store.update({ listings: [...state.listings, ...newListings] });
      } catch (err) {
        console.error('[orchestrator] listing optimization failed:', err);
      }
    }

    let newPrices: PriceRecommendation[] = [];
    if (newProducts.length > 0) {
      try {
        console.log('[orchestrator] step 4/5 — pricing strategy');
        newPrices = [];
        for (const product of newProducts) {
          try {
            const niche = marketReport?.niches.find(n => n.name === product.niche);
            const price = await this.agents.pricing.recommendPrice(product, niche);
            newPrices.push(price);
          } catch (err) {
            console.error(`[orchestrator] pricing failed for ${product.id}:`, err);
          }
        }
        state = this.store.update({ prices: [...state.prices, ...newPrices] });
      } catch (err) {
        console.error('[orchestrator] pricing strategy failed:', err);
      }
    }

    let growthReport: GrowthReport | undefined;
    let newMetrics: ListingMetrics[] = [];
    if (newListings.length > 0) {
      try {
        console.log('[orchestrator] step 5/5 — analytics');
        newMetrics = this.agents.analytics.simulateMetrics(newListings, newPrices);
        growthReport = await this.agents.analytics.generateGrowthReport(newMetrics, newListings);
        state = this.store.update({
          metrics: [...state.metrics, ...newMetrics],
          lastGrowthReport: growthReport,
        });
      } catch (err) {
        console.error('[orchestrator] analytics failed:', err);
      }
    }

    this.printSummary(state);
  }

  async getStatus(): Promise<EtsyBusinessState> {
    return this.store.load();
  }

  private printSummary(state: EtsyBusinessState): void {
    const topRevenue = [...state.metrics]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(m => m.listingId)
      .join(', ');

    const avgPrice =
      state.prices.length > 0
        ? (
            state.prices.reduce((sum, p) => sum + p.recommendedPrice, 0) /
            state.prices.length
          ).toFixed(2)
        : 'N/A';

    const rows: SummaryRow[] = [
      {
        label: 'Products',
        count: state.products.length,
        detail: state.products.map(p => p.title).slice(0, 3).join(', '),
      },
      {
        label: 'Listings',
        count: state.listings.length,
        detail: state.listings.map(l => l.title).slice(0, 3).join(', '),
      },
      {
        label: 'Price recommendations',
        count: state.prices.length,
        detail: `avg $${avgPrice}`,
      },
      {
        label: 'Metrics tracked',
        count: state.metrics.length,
        detail: topRevenue ? `top earners: ${topRevenue}` : 'none yet',
      },
      {
        label: 'Market niches analyzed',
        count: state.lastMarketReport?.niches.length ?? 0,
        detail:
          state.lastMarketReport?.niches
            .slice(0, 3)
            .map(n => n.name)
            .join(', ') ?? 'none',
      },
    ];

    console.log('\n=== Etsy Business Summary ===');
    console.log(formatTable(rows));
    console.log(`Session: ${state.sessionId}`);
    console.log(`Updated: ${state.updatedAt.toISOString()}`);

    if (state.lastGrowthReport?.recommendations.length) {
      console.log('\nGrowth recommendations:');
      state.lastGrowthReport.recommendations.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r}`);
      });
    }
    console.log('');
  }
}
