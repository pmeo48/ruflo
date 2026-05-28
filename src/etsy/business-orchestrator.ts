import Anthropic from '@anthropic-ai/sdk';
import { EtsyResearchAgent } from './agents/research-agent';
import { EtsyContentAgent } from './agents/content-agent';
import { EtsyDesignAgent } from './agents/design-agent';
import { EtsySeoAgent } from './agents/seo-agent';
import { EtsyListingAgent } from './agents/listing-agent';
import { PRODUCT_CATALOG } from './products/index';

export interface ProductRunResult {
  productId: string;
  title: string;
  price: number;
  listingId: string;
  listingUrl?: string;
  isDryRun: boolean;
  durationMs: number;
  error?: string;
}

export interface BusinessRunResult {
  productsPublished: number;
  productsFailed: number;
  results: ProductRunResult[];
  trendReport?: unknown;
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
}

export class EtsyBusinessOrchestrator {
  private client: Anthropic;
  private research: EtsyResearchAgent;
  private content: EtsyContentAgent;
  private design: EtsyDesignAgent;
  private seo: EtsySeoAgent;
  private listing: EtsyListingAgent;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.research = new EtsyResearchAgent(this.client);
    this.content = new EtsyContentAgent(this.client);
    this.design = new EtsyDesignAgent();
    this.seo = new EtsySeoAgent(this.client);
    this.listing = new EtsyListingAgent();
  }

  async launchAllProducts(): Promise<BusinessRunResult> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();
    const results: ProductRunResult[] = [];

    console.log('\n Launching Autonomous Etsy Digital Products Business');
    console.log('='.repeat(60));

    console.log('\n Step 1: Running market research...');
    let trendReport: unknown;
    try {
      trendReport = await this.research.getDailyTrends();
      console.log('   Market research complete');
    } catch {
      console.log('   Market research failed — continuing without trends');
    }

    console.log('\n Step 2: Publishing all 10 products...\n');
    for (const [id, product] of Object.entries(PRODUCT_CATALOG)) {
      const productStart = Date.now();
      console.log(`   [${id}] ${product.title}...`);
      try {
        this.design.getCoverSpec({
          id,
          title: product.title,
          niche: product.niche,
          type: product.type,
        });

        const listingCopy = await this.seo.optimizeListing({
          id,
          title: product.title,
          type: product.type,
          niche: product.niche,
          targetAudience: `${product.niche} professionals and enthusiasts`,
          useCase: `${product.type} for ${product.niche}`,
        });

        const price = this.listing.calculatePrice(product.price, { roundToNine: true });

        const publishResult = await this.listing.createListing({
          productId: id,
          title: listingCopy.title,
          description: listingCopy.description,
          price,
          quantity: 999,
          tags: listingCopy.tags,
          materials: ['digital download', 'PDF', 'instant download'],
          state: 'active',
          type: 'download',
          who_made: 'i_did',
          when_made: 'made_to_order',
          is_supply: false,
        });

        results.push({
          productId: id,
          title: product.title,
          price,
          listingId: publishResult.listingId,
          listingUrl: publishResult.url,
          isDryRun: publishResult.isDryRun,
          durationMs: Date.now() - productStart,
        });
        console.log(`        Listed at $${price} (listing: ${publishResult.listingId})`);

      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        results.push({
          productId: id,
          title: product.title,
          price: product.price,
          listingId: 'failed',
          isDryRun: false,
          durationMs: Date.now() - productStart,
          error,
        });
        console.log(`        Failed: ${error.slice(0, 60)}`);
      }
    }

    const businessResult: BusinessRunResult = {
      productsPublished: results.filter(r => !r.error).length,
      productsFailed: results.filter(r => !!r.error).length,
      results,
      trendReport,
      totalDurationMs: Date.now() - startMs,
      startedAt,
      completedAt: new Date().toISOString(),
    };

    this.printSummary(businessResult);
    return businessResult;
  }

  async runDailyResearch(): Promise<void> {
    console.log('\n Running Daily Market Research...\n');
    const report = await this.research.getDailyTrends();
    console.log('Hot Niches:', (report as { hotNiches?: string[] }).hotNiches?.join(', ') ?? 'N/A');
    console.log('Emerging Opportunities:', (report as { emergingOpportunities?: string[] }).emergingOpportunities?.join(', ') ?? 'N/A');
    console.log('\nTop Trending Products:');
    const trending = (report as { trending?: Array<{ title: string; opportunityScore: number; avgPrice: number }> }).trending ?? [];
    trending.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title} — Score: ${t.opportunityScore}/100 — Avg $${t.avgPrice}`);
    });
  }

  printSummary(result: BusinessRunResult): void {
    const durationSec = (result.totalDurationMs / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log('BUSINESS LAUNCH SUMMARY');
    console.log('='.repeat(60));
    console.log(`Published: ${result.productsPublished} products`);
    console.log(`Failed:    ${result.productsFailed} products`);
    console.log(`Duration:  ${durationSec}s`);
    console.log(`Started:   ${result.startedAt}`);
    console.log('\n' + '-'.repeat(60));
    console.log('PRODUCT LISTINGS:');
    console.log('-'.repeat(60));
    result.results.forEach(r => {
      const status = r.error ? 'FAIL' : (r.isDryRun ? 'DRY ' : ' OK ');
      const detail = r.error ? r.error.slice(0, 40) : `$${r.price} | ${r.listingId}`;
      console.log(`[${status}] [${r.productId}] ${r.title.slice(0, 40).padEnd(40)} ${detail}`);
    });
    console.log('-'.repeat(60));
    if (result.results.some(r => r.isDryRun)) {
      console.log('\nDRY = Dry run (set ETSY_SHOP_ID, ETSY_ACCESS_TOKEN, ETSY_CLIENT_ID to go live)');
    }
  }
}
