import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

let cron: typeof import('node-cron') | null = null;
try {
  cron = require('node-cron');
} catch {
  // node-cron not installed — will use interval fallback
}

export interface SchedulerConfig {
  cronExpression: string;
  enabled: boolean;
  logPath: string;
  maxProductsPerWeek: number;
}

export interface RunLog {
  timestamp: string;
  trigger: 'cron' | 'manual';
  success: boolean;
  productTitle?: string;
  productId?: string;
  listingId?: string;
  isDryRun?: boolean;
  error?: string;
  durationMs: number;
}

export class EtsyProductScheduler {
  private config: SchedulerConfig;
  private client: Anthropic;
  private isRunning = false;
  private task: { stop: () => void } | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      cronExpression: '0 9 * * 1,4',
      enabled: true,
      logPath: path.join(process.cwd(), '.hive-mind', 'sessions', 'scheduler-log.json'),
      maxProductsPerWeek: 2,
      ...config,
    };
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  start(): void {
    if (!this.config.enabled) {
      console.log('[Scheduler] Disabled — set enabled: true to activate');
      return;
    }

    if (cron) {
      this.task = cron.schedule(this.config.cronExpression, () => {
        void this.runProductGeneration('cron');
      });
      console.log(`[Scheduler] Started with cron: ${this.config.cronExpression} (Mon & Thu 9 AM)`);
    } else {
      this.intervalHandle = setInterval(() => {
        const now = new Date();
        const isScheduledDay = now.getDay() === 1 || now.getDay() === 4;
        const isScheduledHour = now.getHours() === 9 && now.getMinutes() < 60;
        const recentLog = this.loadLog().slice(-1)[0];
        const alreadyRanToday = recentLog &&
          new Date(recentLog.timestamp).toDateString() === now.toDateString();

        if (isScheduledDay && isScheduledHour && !alreadyRanToday) {
          void this.runProductGeneration('cron');
        }
      }, 60 * 60 * 1000);
      console.log('[Scheduler] Started with interval fallback (install node-cron for exact scheduling)');
    }
  }

  stop(): void {
    this.task?.stop();
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    console.log('[Scheduler] Stopped');
  }

  async runProductGeneration(trigger: RunLog['trigger'] = 'manual'): Promise<RunLog> {
    if (this.isRunning) {
      const log: RunLog = { timestamp: new Date().toISOString(), trigger, success: false, error: 'Already running — skipped', durationMs: 0 };
      this.saveLog(log);
      return log;
    }

    this.isRunning = true;
    const startMs = Date.now();
    console.log(`[Scheduler] Starting product generation (trigger: ${trigger})`);

    try {
      const { EtsyResearchAgent } = await import('./agents/research-agent');
      const { EtsyContentAgent } = await import('./agents/content-agent');
      const { EtsySeoAgent } = await import('./agents/seo-agent');
      const { EtsyListingAgent } = await import('./agents/listing-agent');
      const { PRODUCT_CATALOG } = await import('./products/index');

      const research = new EtsyResearchAgent(this.client);
      const content = new EtsyContentAgent(this.client);
      const seo = new EtsySeoAgent(this.client);
      const listing = new EtsyListingAgent();

      const trends = await research.getDailyTrends(['AI tools', 'productivity', 'ChatGPT prompts', 'AI guides']);

      const existingNiches = new Set(Object.values(PRODUCT_CATALOG).map(p => p.niche));
      const newOpportunity = trends.trending.find(t =>
        !existingNiches.has(t.niche.toLowerCase().replace(/\s+/g, '-'))
      ) ?? trends.trending[0];

      const topic = newOpportunity?.title ?? 'AI productivity tips';
      const productType = (newOpportunity?.productTypes?.[0] ?? 'guide') as Parameters<typeof content.generateNewProduct>[1];

      console.log(`[Scheduler] Generating new product: "${topic}" (type: ${productType})`);

      const product = await content.generateNewProduct(topic, productType);

      const listingCopy = await seo.optimizeListing({
        id: product.id,
        title: product.title,
        type: product.type,
        niche: product.niche,
        targetAudience: product.targetAudience,
        useCase: topic,
      });

      const price = listing.calculatePrice(
        newOpportunity?.avgPrice ?? 7.99,
        { roundToNine: true }
      );

      const result = await listing.createListing({
        productId: product.id,
        title: listingCopy.title,
        description: listingCopy.description,
        price,
        quantity: 999,
        tags: listingCopy.tags,
        materials: ['digital download', 'PDF'],
        state: 'active',
        type: 'download',
        who_made: 'i_did',
        when_made: 'made_to_order',
        is_supply: false,
      });

      const log: RunLog = {
        timestamp: new Date().toISOString(),
        trigger,
        success: true,
        productTitle: product.title,
        productId: product.id,
        listingId: result.listingId,
        isDryRun: result.isDryRun,
        durationMs: Date.now() - startMs,
      };
      this.saveLog(log);
      console.log(`[Scheduler] Published: "${product.title}" — listing ${result.listingId} (dry run: ${result.isDryRun})`);
      return log;

    } catch (err) {
      const log: RunLog = {
        timestamp: new Date().toISOString(),
        trigger,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startMs,
      };
      this.saveLog(log);
      console.error('[Scheduler] Failed:', log.error);
      return log;
    } finally {
      this.isRunning = false;
    }
  }

  getStats(): { totalRuns: number; successful: number; failed: number; lastRun?: string; nextScheduled: string } {
    const log = this.loadLog();
    const nextRun = this.getNextScheduledTime();
    return {
      totalRuns: log.length,
      successful: log.filter(l => l.success).length,
      failed: log.filter(l => !l.success).length,
      lastRun: log.slice(-1)[0]?.timestamp,
      nextScheduled: nextRun,
    };
  }

  private getNextScheduledTime(): string {
    const now = new Date();
    const nextMonday = new Date(now);
    const nextThursday = new Date(now);
    const daysToMonday = (8 - now.getDay()) % 7 || 7;
    const daysToThursday = (11 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysToMonday);
    nextThursday.setDate(now.getDate() + daysToThursday);
    nextMonday.setHours(9, 0, 0, 0);
    nextThursday.setHours(9, 0, 0, 0);
    const next = nextMonday < nextThursday ? nextMonday : nextThursday;
    return next.toISOString();
  }

  private loadLog(): RunLog[] {
    try {
      if (!fs.existsSync(this.config.logPath)) return [];
      return JSON.parse(fs.readFileSync(this.config.logPath, 'utf-8')) as RunLog[];
    } catch {
      return [];
    }
  }

  private saveLog(entry: RunLog): void {
    const log = this.loadLog();
    log.push(entry);
    const dir = path.dirname(this.config.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.config.logPath, JSON.stringify(log, null, 2));
  }
}
