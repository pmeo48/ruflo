import { NextResponse } from 'next/server'
import { createPin, getPins, isPinterestConfigured } from '@/lib/pinterest'

const MOCK_PINS = [
  { id: 'pin-1', title: 'AI Insurance Agent Toolkit', description: '250+ AI prompts for insurance agents', link: '/store', created_at: new Date().toISOString() },
  { id: 'pin-2', title: 'AI Business Growth Vault', description: 'Complete AI business toolkit bundle', link: '/store', created_at: new Date().toISOString() },
  { id: 'pin-3', title: 'Notion Business OS', description: 'Ultimate Notion workspace for AI businesses', link: '/store', created_at: new Date().toISOString() },
]

export async function GET() {
  if (!isPinterestConfigured()) {
    return NextResponse.json({
      pins: MOCK_PINS,
      configured: false,
      message: 'Demo mode. Add PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID to enable.',
    })
  }
  try {
    const data = await getPins()
    return NextResponse.json({ pins: data.items ?? [], configured: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, link, imageUrl, altText } = await req.json()

    if (!isPinterestConfigured()) {
      return NextResponse.json({
        id: `mock-pin-${Date.now()}`,
        title,
        description,
        link,
        demo: true,
        message: 'Mock pin created. Configure Pinterest API to post real pins.',
        created_at: new Date().toISOString(),
      })
    }

    const pin = await createPin({ title, description, link, imageUrl, altText })
    return NextResponse.json(pin)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
