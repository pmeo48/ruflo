import Anthropic from '@anthropic-ai/sdk';
import type { Product, EtsyListing } from '../types';

export class ListingOptimizerAgent {
  constructor(private client: Anthropic) {}

  async optimizeListing(product: Product): Promise<EtsyListing> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:
        'You are an Etsy SEO expert. Create optimized product listings that maximize search visibility and conversion rates.',
      messages: [
        {
          role: 'user',
          content: `Create an SEO-optimized Etsy listing for this product. Return ONLY raw JSON with no markdown or code blocks.\n\nProduct:\n${JSON.stringify(product, null, 2)}\n\nReturn a JSON object with these exact fields:\n- productId: string (use the product's id exactly)\n- title: string (max 140 chars, keyword-front-loaded, no ALL CAPS, start with main keyword)\n- description: string (300-500 chars, benefits-first, includes use cases, bullet points with line breaks)\n- tags: array of exactly 13 strings (lowercase, 1-20 chars each, mix of broad and specific)\n- category: string (Etsy category path, e.g. "Paper & Party Supplies > Paper > Stationery")\n- primaryImageAlt: string (descriptive alt text for main product image)\n- sectionPlacement: string (recommended shop section name)`,
        },
      ],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const parsed = JSON.parse(rawText) as EtsyListing;
      parsed.productId = product.id;
      return parsed;
    } catch {
      return {
        productId: product.id,
        title: product.title,
        description: `${product.title} - Digital download for ${product.targetAudience}. Perfect for ${product.useCase}.`,
        tags: [
          product.type,
          product.niche,
          'digital download',
          'instant download',
          'printable',
          product.targetAudience,
          product.useCase,
          'digital file',
          'commercial use',
          'svg file',
          'pdf download',
          'diy project',
          'craft supply',
        ],
        category: 'Paper & Party Supplies > Paper > Stationery',
        primaryImageAlt: `${product.title} digital download preview`,
        sectionPlacement: product.niche,
      };
    }
  }

  async optimizeListings(products: Product[]): Promise<EtsyListing[]> {
    const results: EtsyListing[] = [];
    for (const product of products) {
      results.push(await this.optimizeListing(product));
    }
    return results;
  }
}
