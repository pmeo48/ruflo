import { NextRequest, NextResponse } from 'next/server'
import { ResearchData, Competitor } from '@/lib/types'

const MOCK_RESEARCH: ResearchData = {
  keyword: 'AI business prompts',
  competitors: [
    { shopName: 'DigitalDownloadPro', productTitle: 'AI Business Prompt Pack - 500+ ChatGPT Prompts', price: 24.99, sales: 4230, rating: 4.9, tags: ['ai prompts', 'chatgpt', 'business'], listingUrl: 'https://etsy.com/listing/1' },
    { shopName: 'NotionTemplateHub', productTitle: 'Ultimate Notion Business OS Template', price: 47, sales: 2890, rating: 4.8, tags: ['notion template', 'business os', 'productivity'], listingUrl: 'https://etsy.com/listing/2' },
    { shopName: 'AIToolsShop', productTitle: 'Complete AI Agency Toolkit', price: 97, sales: 1240, rating: 4.7, tags: ['ai agency', 'consulting', 'business kit'], listingUrl: 'https://etsy.com/listing/3' },
  ],
  marketSize: 240000,
  avgPrice: 34.20,
  topTags: ['ai prompts', 'chatgpt', 'digital download', 'business templates', 'entrepreneur'],
  opportunity: 'high',
  recommendations: [
    'Target long-tail keywords with lower competition',
    'Price between $27-$47 for maximum conversion',
    'Include "instant download" in title for 23% higher CTR',
    'Add niche-specific tags to capture underserved markets',
    'Offer a lite version at $9-$17 to capture price-sensitive buyers',
  ],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || 'AI business prompts'

    return NextResponse.json({
      ...MOCK_RESEARCH,
      keyword,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research data' }, { status: 500 })
  }
}
