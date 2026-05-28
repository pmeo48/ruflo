import Anthropic from '@anthropic-ai/sdk';
import type { MarketReport, Niche } from '../types';

const SYSTEM_PROMPT =
  'You are an Etsy market research expert. Analyze digital product opportunities and return structured JSON data about profitable niches.';

interface RawNiche {
  id: string;
  name: string;
  opportunityScore: number;
  searchVolume: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
  avgPrice: number;
  tags: string[];
}

interface RawMarketReport {
  niches: RawNiche[];
  topKeywords: string[];
}

function buildUserMessage(focusNiche?: string): string {
  return `Research profitable Etsy digital product niches${focusNiche ? ` focusing on: ${focusNiche}` : ''}.
Return a JSON object matching this exact structure (no markdown, raw JSON only):
{
  "niches": [
    {
      "id": "niche-1",
      "name": "Wedding Printables",
      "opportunityScore": 85,
      "searchVolume": "high",
      "competitionLevel": "medium",
      "avgPrice": 4.99,
      "tags": ["wedding", "printable", "bridal", "party", "invitation"]
    }
  ],
  "topKeywords": ["printable", "digital download", "instant download", "svg cut file", "planner"]
}
Include exactly 5 niches with realistic data.`;
}

function isValidNiche(value: unknown): value is Niche {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n['id'] === 'string' &&
    typeof n['name'] === 'string' &&
    typeof n['opportunityScore'] === 'number' &&
    (n['searchVolume'] === 'high' || n['searchVolume'] === 'medium' || n['searchVolume'] === 'low') &&
    (n['competitionLevel'] === 'high' || n['competitionLevel'] === 'medium' || n['competitionLevel'] === 'low') &&
    typeof n['avgPrice'] === 'number' &&
    Array.isArray(n['tags'])
  );
}

function parseReport(text: string): RawMarketReport | null {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as Record<string, unknown>)['niches']) ||
      !Array.isArray((parsed as Record<string, unknown>)['topKeywords'])
    ) {
      return null;
    }
    return parsed as RawMarketReport;
  } catch {
    return null;
  }
}

const EMPTY_REPORT: MarketReport = {
  niches: [],
  topKeywords: [],
  generatedAt: new Date(),
};

export class MarketResearchAgent {
  constructor(private client: Anthropic) {}

  async research(opts?: { focusNiche?: string }): Promise<MarketReport> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserMessage(opts?.focusNiche),
          },
        ],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') {
        return { ...EMPTY_REPORT, generatedAt: new Date() };
      }

      const raw = parseReport(block.text);
      if (!raw) {
        return { ...EMPTY_REPORT, generatedAt: new Date() };
      }

      const niches: Niche[] = raw.niches.filter(isValidNiche);

      return {
        niches,
        topKeywords: raw.topKeywords.filter((k): k is string => typeof k === 'string'),
        generatedAt: new Date(),
      };
    } catch {
      return { ...EMPTY_REPORT, generatedAt: new Date() };
    }
  }
}
