import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

export type ProductType = 'prompt-pack' | 'guide' | 'cheat-sheet' | 'template' | 'bundle';

export interface ProductContent {
  id: string;
  title: string;
  subtitle: string;
  type: ProductType;
  wordCount: number;
  pages: number;
  fileFormats: string[];
  niche: string;
  targetAudience: string;
  content: unknown;
}

function stripFences(text: string): string {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
}

function isProductType(value: unknown): value is ProductType {
  return (
    value === 'prompt-pack' ||
    value === 'guide' ||
    value === 'cheat-sheet' ||
    value === 'template' ||
    value === 'bundle'
  );
}

function isProductContent(value: unknown): value is ProductContent {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p['id'] === 'string' &&
    typeof p['title'] === 'string' &&
    typeof p['subtitle'] === 'string' &&
    isProductType(p['type']) &&
    typeof p['wordCount'] === 'number' &&
    typeof p['pages'] === 'number' &&
    Array.isArray(p['fileFormats']) &&
    typeof p['niche'] === 'string' &&
    typeof p['targetAudience'] === 'string'
  );
}

export class EtsyContentAgent {
  private productsDir: string;

  constructor(private client: Anthropic, productsDir?: string) {
    this.productsDir = productsDir ?? path.join(process.cwd(), 'src', 'etsy', 'products');
  }

  loadProduct(productId: string): ProductContent {
    const contentDir = path.join(this.productsDir, 'content');
    const jsonPath = path.join(contentDir, `${productId}.json`);

    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (isProductContent(parsed)) return parsed;
      throw new Error(`Product file at ${jsonPath} does not match ProductContent schema.`);
    }

    if (fs.existsSync(contentDir)) {
      const files = fs.readdirSync(contentDir).filter((f: string) => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(contentDir, file);
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw) as unknown;
          if (isProductContent(parsed) && parsed.id === productId) return parsed;
        } catch {
          continue;
        }
      }
    }

    throw new Error(
      `Product "${productId}" not found. Expected JSON at ${jsonPath} or a matching id in ${contentDir}.`
    );
  }

  getAllProducts(): ProductContent[] {
    const contentDir = path.join(this.productsDir, 'content');

    if (!fs.existsSync(contentDir)) {
      console.warn(`[EtsyContentAgent] Products content directory not found: ${contentDir}`);
      return [];
    }

    const files = fs.readdirSync(contentDir).filter((f: string) => f.endsWith('.json'));
    const products: ProductContent[] = [];

    for (const file of files) {
      const filePath = path.join(contentDir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as unknown;
        if (isProductContent(parsed)) products.push(parsed);
      } catch {
        console.warn(`[EtsyContentAgent] Failed to parse ${file}, skipping.`);
      }
    }

    return products;
  }

  async generateNewProduct(topic: string, type: ProductType): Promise<ProductContent> {
    const id = `${type}-${topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

    const typeInstructions: Record<ProductType, string> = {
      'prompt-pack': `Generate a complete prompt pack with 50 prompts organized into 5 categories (10 prompts each). Each prompt should be specific, actionable, and ready to use. Structure as: { "categories": [{ "name": "...", "prompts": ["...", ...] }] }`,
      guide: `Generate a comprehensive guide with 5 chapters. Each chapter should have a title, introduction paragraph, 3-5 key sections with content, and a summary. Structure as: { "chapters": [{ "title": "...", "intro": "...", "sections": [{ "heading": "...", "content": "..." }], "summary": "..." }] }`,
      'cheat-sheet': `Generate a concise cheat sheet with 8-10 sections, each containing quick-reference tips, commands, or frameworks. Structure as: { "sections": [{ "title": "...", "items": ["...", ...] }] }`,
      template: `Generate a ready-to-use template with 5 sections including headers, placeholder text, and formatting instructions. Structure as: { "sections": [{ "title": "...", "content": "...", "placeholder": "..." }] }`,
      bundle: `Generate a bundle overview describing 5 included products, each with a title, description, and key benefits. Structure as: { "items": [{ "title": "...", "description": "...", "benefits": ["...", ...] }] }`,
    };

    const pageCounts: Record<ProductType, number> = {
      'prompt-pack': 12,
      guide: 20,
      'cheat-sheet': 4,
      template: 8,
      bundle: 16,
    };

    const prompt = `Create a complete, high-quality Etsy digital product about "${topic}" of type "${type}".

${typeInstructions[type]}

Return raw JSON only (no markdown) matching this exact structure:
{
  "id": "${id}",
  "title": "Compelling product title including '${topic}'",
  "subtitle": "Brief benefit-focused subtitle (max 100 chars)",
  "type": "${type}",
  "wordCount": <realistic word count>,
  "pages": ${pageCounts[type]},
  "fileFormats": ["PDF", "DOCX"],
  "niche": "<specific niche this belongs to>",
  "targetAudience": "<who this is for>",
  "content": <the full content object per the type instructions above>
}

Make the content genuinely useful and detailed. Return only the JSON.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') {
        return this.fallbackProduct(id, topic, type, pageCounts[type]);
      }

      const parsed = JSON.parse(stripFences(block.text)) as unknown;
      if (isProductContent(parsed)) return parsed;

      return this.fallbackProduct(id, topic, type, pageCounts[type]);
    } catch {
      return this.fallbackProduct(id, topic, type, pageCounts[type]);
    }
  }

  async saveProduct(product: ProductContent): Promise<string> {
    const contentDir = path.join(this.productsDir, 'content');
    fs.mkdirSync(contentDir, { recursive: true });

    const filePath = path.join(contentDir, `${product.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(product, null, 2), 'utf-8');

    return filePath;
  }

  private fallbackProduct(id: string, topic: string, type: ProductType, pages: number): ProductContent {
    return {
      id,
      title: `${topic} — ${type.replace('-', ' ')} for Beginners`,
      subtitle: `The complete ${type.replace('-', ' ')} to master ${topic}`,
      type,
      wordCount: pages * 200,
      pages,
      fileFormats: ['PDF'],
      niche: topic,
      targetAudience: 'beginners and intermediate users',
      content: { generated: false, topic, type },
    };
  }
}
