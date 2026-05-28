import Anthropic from '@anthropic-ai/sdk';

export interface EtsyListingCopy {
  productId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
}

const SEO_SYSTEM =
  'You are an Etsy SEO expert. You write listings that rank #1 for their target keywords and convert browsers into buyers.';

const GENERIC_TAGS = [
  'digital download',
  'instant download',
  'printable',
  'digital product',
  'pdf download',
  'digital template',
  'digital guide',
  'digital file',
  'editable template',
  'commercial use',
  'personal use',
  'beginner guide',
  'how to guide',
];

function stripFences(text: string): string {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ProductInput = Parameters<EtsySeoAgent['optimizeListing']>[0];

export class EtsySeoAgent {
  constructor(private client: Anthropic) {}

  async optimizeListing(product: {
    id: string;
    title: string;
    type: string;
    niche: string;
    targetAudience: string;
    useCase: string;
  }): Promise<EtsyListingCopy> {
    const fallback: EtsyListingCopy = {
      productId: product.id,
      title: product.title.slice(0, 140),
      description: `✅ ${product.title}\n\n⚡ Perfect for ${product.targetAudience}.\n\n🔥 Use this to ${product.useCase}.\n\n📌 Instant digital download — no waiting!`,
      tags: this.validateTags(GENERIC_TAGS.slice(0, 13)),
      category: 'Craft Supplies & Tools > Patterns & How To > Patterns',
      primaryKeyword: product.niche,
      secondaryKeywords: [product.type, product.targetAudience],
    };

    const prompt = `Optimize an Etsy listing for a digital product with these details:
- Product ID: ${product.id}
- Title: ${product.title}
- Type: ${product.type}
- Niche: ${product.niche}
- Target Audience: ${product.targetAudience}
- Use Case: ${product.useCase}

Return raw JSON only (no markdown) matching this exact structure:
{
  "productId": "${product.id}",
  "title": "<≤140 chars, start with primary keyword, compelling>",
  "description": "<400-600 chars, benefits-first with emoji bullets: ✅ 🔥 ⚡ 📌>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>", "<tag7>", "<tag8>", "<tag9>", "<tag10>", "<tag11>", "<tag12>", "<tag13>"],
  "category": "Craft Supplies & Tools > Patterns & How To > Patterns",
  "primaryKeyword": "<main keyword>",
  "secondaryKeywords": ["<kw1>", "<kw2>", "<kw3>"]
}

Rules:
- title: ≤140 characters, front-load the primary keyword
- description: 400-600 characters total, use emoji bullets (✅, 🔥, ⚡, 📌), benefits-first
- tags: exactly 13 tags, all lowercase, each tag ≤20 characters, no duplicate concepts
- category: use the correct Etsy v3 taxonomy for digital download products
Return only the JSON object, nothing else.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SEO_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') return fallback;

      const parsed = JSON.parse(stripFences(block.text)) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return fallback;

      const raw = parsed as Record<string, unknown>;

      return {
        productId: product.id,
        title: typeof raw['title'] === 'string' ? raw['title'].slice(0, 140) : fallback.title,
        description:
          typeof raw['description'] === 'string' ? raw['description'] : fallback.description,
        tags: this.validateTags(
          Array.isArray(raw['tags'])
            ? (raw['tags'] as unknown[]).filter((t): t is string => typeof t === 'string')
            : fallback.tags
        ),
        category:
          typeof raw['category'] === 'string' ? raw['category'] : fallback.category,
        primaryKeyword:
          typeof raw['primaryKeyword'] === 'string'
            ? raw['primaryKeyword']
            : fallback.primaryKeyword,
        secondaryKeywords: Array.isArray(raw['secondaryKeywords'])
          ? (raw['secondaryKeywords'] as unknown[]).filter(
              (k): k is string => typeof k === 'string'
            )
          : fallback.secondaryKeywords,
      };
    } catch {
      return fallback;
    }
  }

  async bulkOptimize(products: ProductInput[]): Promise<EtsyListingCopy[]> {
    const results: EtsyListingCopy[] = [];

    for (let i = 0; i < products.length; i++) {
      if (i > 0) await delay(500);
      const result = await this.optimizeListing(products[i]);
      results.push(result);
    }

    return results;
  }

  validateTags(tags: string[]): string[] {
    const cleaned = tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0 && t.length <= 20);

    const deduped = [...new Set(cleaned)];

    if (deduped.length > 13) return deduped.slice(0, 13);

    if (deduped.length < 13) {
      const fillers = GENERIC_TAGS.map((t) => t.toLowerCase()).filter(
        (t) => !deduped.includes(t) && t.length <= 20
      );

      const padded = [...deduped];
      for (const filler of fillers) {
        if (padded.length >= 13) break;
        padded.push(filler);
      }

      return padded.slice(0, 13);
    }

    return deduped;
  }
}
