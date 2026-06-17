import { NextResponse } from 'next/server'

const PRODUCT_TEMPLATES: Record<string, { contents: string[]; chapters: string[] }> = {
  pdf: {
    contents: ['Complete Strategy Guide', 'Step-by-Step Tutorials', 'Real-World Examples', 'Worksheets & Exercises', 'Resource Library', 'Quick Reference Sheets'],
    chapters: ['Getting Started', 'Core Concepts', 'Advanced Strategies', 'Implementation Guide', 'Measuring Success'],
  },
  spreadsheet: {
    contents: ['Main Tracking Dashboard', 'Auto-Calculation Formulas', 'Chart & Visualization Templates', 'Data Import Templates', 'Reporting Sheets', 'Instructions Tab'],
    chapters: [],
  },
  notion: {
    contents: ['Master Dashboard', 'Project Management Board', 'Database Templates', 'Content Calendar', 'Goal Tracking System', 'Resource Library', 'SOP Documentation'],
    chapters: [],
  },
  'prompt-pack': {
    contents: ['250+ AI Prompts', 'Category Index', 'Usage Guide', 'Example Outputs', 'Prompt Customization Tips', 'Platform-Specific Versions'],
    chapters: ['Quick Start Prompts', 'Core Business Prompts', 'Advanced Strategies', 'Niche-Specific Prompts', 'Bonus Prompt Formulas'],
  },
}

export async function POST(req: Request) {
  try {
    const { productType, niche, title } = await req.json()
    const template = PRODUCT_TEMPLATES[productType] ?? PRODUCT_TEMPLATES['prompt-pack']

    const nicheWords = niche.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const typeLabels: Record<string, string> = {
      pdf: 'Complete Guide', spreadsheet: 'Spreadsheet System', notion: 'Notion Template', 'prompt-pack': 'AI Prompt Pack',
    }

    const generatedName = title || `${nicheWords} AI ${typeLabels[productType] ?? 'Toolkit'}`
    const prices: Record<string, number> = { pdf: 27, spreadsheet: 37, notion: 47, 'prompt-pack': 29 }

    const tags = [
      `${niche} tools`, `AI ${productType}`, `${niche} templates`, 'ChatGPT prompts', 'digital download',
      `${niche} business`, 'AI tools', 'productivity templates', 'entrepreneur tools', 'passive income',
      'digital products', 'business templates', 'etsy digital',
    ].slice(0, 13)

    return NextResponse.json({
      name: generatedName,
      description: `Transform your ${niche} business with this comprehensive AI-powered toolkit. Designed specifically for ${niche} professionals, this ${typeLabels[productType]} includes everything you need to work smarter and grow faster.`,
      contents: template.contents,
      chapters: template.chapters,
      tags,
      price: prices[productType] ?? 29,
      salesCopy: `The ultimate AI toolkit for ${niche} professionals. Save 10+ hours per week and grow your business with AI.`,
    })
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
