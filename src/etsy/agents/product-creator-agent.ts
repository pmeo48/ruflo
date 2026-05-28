import Anthropic from '@anthropic-ai/sdk';
import type { MarketReport, Product, ProductType, ProductVariant } from '../types';

const VALID_PRODUCT_TYPES = new Set<ProductType>([
  'printable',
  'svg',
  'template',
  'planner',
  'wall-art',
  'digital-paper',
  'font',
  'mockup',
]);

function isProductType(value: unknown): value is ProductType {
  return typeof value === 'string' && VALID_PRODUCT_TYPES.has(value as ProductType);
}

function isVariant(value: unknown): value is ProductVariant {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['name'] === 'string' && typeof v['fileFormat'] === 'string';
}

interface RawProduct {
  title: string;
  type: string;
  niche: string;
  targetAudience: string;
  useCase: string;
  variants: unknown[];
}

function isRawProduct(value: unknown): value is RawProduct {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p['title'] === 'string' &&
    typeof p['type'] === 'string' &&
    typeof p['niche'] === 'string' &&
    typeof p['targetAudience'] === 'string' &&
    typeof p['useCase'] === 'string' &&
    Array.isArray(p['variants'])
  );
}

function buildPrompt(report: MarketReport, count: number): string {
  const sorted = [...report.niches].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const topNiches = sorted.slice(0, count);
  const nicheContext = JSON.stringify(topNiches, null, 2);

  return `You are an Etsy digital product specialist. Based on the following market research niches, generate ${count} product specifications.

Top niches:
${nicheContext}

Return a raw JSON array (no markdown) with exactly ${count} products. Each product must match this structure:
[
  {
    "title": "Elegant Wedding Invitation Template Set",
    "type": "printable",
    "niche": "Wedding Printables",
    "targetAudience": "wedding planners, brides-to-be",
    "useCase": "printable invitations for DIY weddings",
    "variants": [
      { "name": "Blush Pink", "fileFormat": "PDF", "dimensions": "5x7 in" },
      { "name": "Ivory White", "fileFormat": "PDF", "dimensions": "5x7 in" }
    ],
    "status": "ready"
  }
]

Valid type values: printable, svg, template, planner, wall-art, digital-paper, font, mockup.
Each product must have 2-3 variants. Return only the JSON array, no other text.`;
}

function parseProducts(text: string): RawProduct[] {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRawProduct);
  } catch {
    return [];
  }
}

export class ProductCreatorAgent {
  constructor(private client: Anthropic) {}

  async createProducts(report: MarketReport, count: number = 3): Promise<Product[]> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: buildPrompt(report, count),
          },
        ],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') return [];

      const rawProducts = parseProducts(block.text);

      return rawProducts.slice(0, count).map((raw, index): Product => ({
        id: `prod-${Date.now()}-${index}`,
        title: raw.title,
        type: isProductType(raw.type) ? raw.type : 'printable',
        niche: raw.niche,
        targetAudience: raw.targetAudience,
        useCase: raw.useCase,
        variants: raw.variants.filter(isVariant),
        status: 'ready',
        createdAt: new Date(),
      }));
    } catch {
      return [];
    }
  }
}
