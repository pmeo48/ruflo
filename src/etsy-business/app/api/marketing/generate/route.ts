import { NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const { productId, platform } = await req.json()
    const product = MOCK_PRODUCTS.find(p => p.id === productId) ?? MOCK_PRODUCTS[0]

    const content: Record<string, { title: string; content: string; hashtags?: string[] }> = {
      pinterest: {
        title: `Pin: ${product.name}`,
        content: `${product.salesCopy ?? product.description}\n\nGet it now — instant digital download!`,
        hashtags: ['#aitools', '#etsyseller', '#passiveincome', '#digitalproducts', '#sidehustle'],
      },
      blog: {
        title: `How ${product.name} Can Transform Your Business`,
        content: `In this post we dive deep into how ${product.name} helps entrepreneurs save time and make more money. Here's what's included and why thousands of business owners love it...`,
      },
      email: {
        title: `Subject: ${product.salesCopy ?? 'New product just dropped'}`,
        content: `Hey [First Name],\n\nExcited to share the ${product.name} with you.\n\n${product.description}\n\nGet it here → [LINK]\n\nBest,\n[Your Name]`,
      },
      social: {
        title: 'Instagram/Twitter Post',
        content: `${product.salesCopy ?? product.description}\n\n${product.name} — available now. Link in bio!`,
        hashtags: ['#digitalproducts', '#passiveincome', '#entrepreneur', '#aitools', '#sidehustle'],
      },
    }

    return NextResponse.json(content[platform] ?? content['social'])
  } catch {
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
