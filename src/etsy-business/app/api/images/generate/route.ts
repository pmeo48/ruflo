import { NextResponse } from 'next/server'
import { generateProductImage } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { productName, productType, niche, style = 'cover' } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: 'productName is required' }, { status: 400 })
    }

    const imageUrl = await generateProductImage(
      productName,
      productType ?? 'pdf',
      niche ?? 'business',
      style
    )

    if (!imageUrl) {
      return NextResponse.json({
        url: null,
        placeholder: true,
        message: 'OPENAI_API_KEY not configured or image generation failed'
      })
    }

    return NextResponse.json({ url: imageUrl, placeholder: false })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
