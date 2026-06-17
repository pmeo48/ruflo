import { NextRequest, NextResponse } from 'next/server'
import { GenerateContentRequest, ContentPiece } from '@/lib/types'

const CONTENT_PROMPTS = {
  pinterest: (productName: string) => `Create a viral Pinterest pin description for: ${productName}. Include emojis, benefits, and a call-to-action. Max 500 chars.`,
  blog: (productName: string) => `Write a 500-word blog article about how ${productName} helps entrepreneurs. Include H2 headers, benefits, and a CTA.`,
  email: (productName: string) => `Write a 3-email welcome sequence for buyers of ${productName}. Day 0, Day 2, Day 5. Focus on value delivery.`,
  social: (productName: string) => `Write 3 social media posts for ${productName}. One story-based, one tips-based, one testimonial-based. Include hashtags.`,
}

const MOCK_GENERATED: Record<string, string> = {
  pinterest: '✨ This changed everything for my business...\n\nI used to spend HOURS on [task]. Now AI does it in minutes.\n\n✅ 200+ done-for-you prompts\n✅ Instant download\n✅ Works with ChatGPT & Claude\n\nLink in bio 👆\n\n#AIBusiness #ChatGPT #SideHustle #DigitalDownload #PassiveIncome',
  blog: '# How This AI Toolkit Saved My Business 15 Hours Per Week\n\nWhen I discovered AI tools, I thought they were just for tech people. I was wrong...\n\n## The Problem\nMost business owners waste 60% of their time on repetitive tasks.\n\n## The Solution\n[Product Name] gives you the exact prompts to automate the work.\n\n## Results\nOur customers report saving 10-15 hours per week on average.\n\n[Get Instant Access →]',
  email: 'Email 1: Welcome + your first win\nEmail 2: The feature nobody uses (but should)\nEmail 3: Success story + what\'s next',
  social: 'Post 1 (Story): "I almost gave up on my business last year. Then I found AI..."\nPost 2 (Tips): "3 AI prompts every entrepreneur needs"\nPost 3 (Social proof): "Sarah made $2K her first month using these prompts"',
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json()
    const { productId, productName, contentTypes } = body

    const pieces: ContentPiece[] = contentTypes.map(type => ({
      type: type as ContentPiece['type'],
      title: `${productName} - ${type} content`,
      content: MOCK_GENERATED[type]?.replace('[Product Name]', productName) || `Generated ${type} content for ${productName}`,
      hashtags: type === 'pinterest' || type === 'social' ? ['#AIBusiness', '#ChatGPT', '#DigitalDownload', '#SideHustle'] : undefined,
    }))

    return NextResponse.json({ pieces, productName })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
