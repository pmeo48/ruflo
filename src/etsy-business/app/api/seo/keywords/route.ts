import { NextRequest, NextResponse } from 'next/server'
import { MOCK_KEYWORDS } from '@/lib/mock-data'
import { buildKeywordResearchPrompt } from '@/lib/seo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const niche = searchParams.get('niche')
    const sort = searchParams.get('sort') || 'relevance'

    let keywords = [...MOCK_KEYWORDS]
    if (sort === 'volume') keywords.sort((a, b) => b.searchVolume - a.searchVolume)
    else if (sort === 'competition') keywords.sort((a, b) => a.competition.localeCompare(b.competition))
    else keywords.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({ keywords, total: keywords.length, niche })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { niche } = await request.json()
    const prompt = buildKeywordResearchPrompt(niche)

    // Mock keyword research results
    const keywords = MOCK_KEYWORDS.map(kw => ({
      ...kw,
      term: niche ? `${niche.toLowerCase()} ${kw.term}` : kw.term,
    })).slice(0, 10)

    return NextResponse.json({ keywords, niche, prompt })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to research keywords' } , { status: 500 })
  }
}
