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
