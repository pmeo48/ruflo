import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_KEYWORDS } from '@/lib/mock-data'
import { Keyword } from '@/lib/types'

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('search_volume', { ascending: false })

      if (error) throw error

      const keywords: Keyword[] = (data ?? []).map((row) => ({
        term: row.term,
        searchVolume: row.search_volume ?? 0,
        competition: row.competition ?? 'medium',
        relevanceScore: row.relevance_score ?? 0,
        trend: row.trend ?? 'stable',
      }))

      return NextResponse.json(keywords)
    } catch (err) {
      console.error('Supabase error fetching keywords, falling back to mock:', err)
    }
  }

  return NextResponse.json(MOCK_KEYWORDS)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { keyword, volume, competition, niche, trend, relevanceScore } = body as {
      keyword: string
      volume?: number
      competition?: 'low' | 'medium' | 'high'
      niche?: string
      trend?: 'up' | 'down' | 'stable'
      relevanceScore?: number
    }

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('keywords')
        .insert([{
          term: keyword,
          search_volume: volume ?? 0,
          competition: competition ?? 'medium',
          niche: niche ?? null,
          trend: trend ?? 'stable',
          relevance_score: relevanceScore ?? 0,
        }])
        .select()
        .single()

      if (error) throw error

      const result: Keyword = {
        term: data.term,
        searchVolume: data.search_volume ?? 0,
        competition: data.competition ?? 'medium',
        relevanceScore: data.relevance_score ?? 0,
        trend: data.trend ?? 'stable',
      }

      return NextResponse.json(result, { status: 201 })
    }

    // Mock fallback
    const result: Keyword = {
      term: keyword,
      searchVolume: volume ?? 0,
      competition: competition ?? 'medium',
      relevanceScore: relevanceScore ?? 0,
      trend: trend ?? 'stable',
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('Error creating keyword:', err)
    return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 })
  }
}
