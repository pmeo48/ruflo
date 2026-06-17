import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

export const openai = apiKey ? new OpenAI({ apiKey }) : null

export async function generateWithOpenAI(systemPrompt: string, userPrompt: string, model = 'gpt-4o-mini'): Promise<string> {
  if (!openai) throw new Error('OPENAI_API_KEY not configured')
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })
  return response.choices[0].message.content ?? ''
}

export async function generateProductImage(
  productName: string,
  productType: string,
  niche: string,
  style: 'cover' | 'mockup' | 'social' = 'cover'
): Promise<string | null> {
  if (!openai) return null

  const stylePrompts: Record<string, string> = {
    cover: `Professional digital product cover for "${productName}". Clean, modern design with bold typography, gradient background in navy blue and purple, minimal icons representing ${niche} and AI technology. High quality, suitable for Etsy listing. No text overlay needed.`,
    mockup: `Professional device mockup showing a digital product for "${productName}". MacBook and iPad displaying a clean dashboard/document interface. Dark background, studio lighting, premium feel. Product is about ${niche}.`,
    social: `Eye-catching social media graphic for "${productName}". Bold colors, modern layout, represents ${niche} business automation. Clean and professional, optimized for Pinterest.`
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: stylePrompts[style],
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })
    return response.data?.[0]?.url ?? null
  } catch (error) {
    console.error('Image generation failed:', error)
    return null
  }
}
