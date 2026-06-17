import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null

export async function generateWithClaude(systemPrompt: string, userPrompt: string, model = 'claude-haiku-4-5-20251001'): Promise<string> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not configured')
  const response = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
