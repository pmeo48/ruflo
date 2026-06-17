import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
})

export async function generateWithClaude(prompt: string, systemPrompt?: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-placeholder') {
    return 'AI generation requires a valid Anthropic API key. Configure ANTHROPIC_API_KEY in your environment.'
  }

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: systemPrompt || 'You are an expert Etsy digital product creator and business consultant.',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}
