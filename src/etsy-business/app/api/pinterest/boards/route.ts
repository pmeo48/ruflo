import { NextResponse } from 'next/server'
import { getBoards, isPinterestConfigured } from '@/lib/pinterest'

export async function GET() {
  if (!isPinterestConfigured()) {
    return NextResponse.json({
      boards: [
        { id: 'board-1', name: 'AI Business Tools', description: 'Top AI tools for entrepreneurs', pin_count: 47 },
        { id: 'board-2', name: 'Digital Products', description: 'Best digital downloads', pin_count: 23 },
        { id: 'board-3', name: 'Notion Templates', description: 'Notion workspace templates', pin_count: 31 },
      ],
      configured: false,
    })
  }
  try {
    const data = await getBoards()
    return NextResponse.json({ boards: data.items ?? [], configured: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
