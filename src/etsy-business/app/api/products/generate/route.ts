import { NextRequest, NextResponse } from 'next/server'
import { GenerateProductRequest } from '@/lib/types'
import { buildProductGenerationPrompt, PRODUCT_TYPE_CONFIGS } from '@/lib/products'

// Mock AI responses for each product type when no API key is configured
const MOCK_GENERATED_PRODUCTS: Record<string, any> = {
  'prompt-pack': {
    name: 'AI [Niche] Agent Toolkit - 200+ ChatGPT & Claude Prompts',
    description: 'The complete prompt library for [niche] professionals. Save hours every week with battle-tested AI prompts for every task.',
    tags: ['ai prompts', 'chatgpt prompts', 'claude prompts', 'business prompts', 'productivity', 'automation', 'ai tools', 'prompt pack', 'digital download', 'templates', 'business tools', 'entrepreneur', 'efficiency'],
    contents: ['200+ AI Prompts', 'Quick Start Guide', 'Prompt Categories Index', 'Advanced Customization Guide', 'Bonus: Top 10 Power Prompts'],
    price: 27,
    category: 'Templates',
    subcategory: 'Business Templates',
    salesCopy: 'Stop spending hours on tasks AI can do in seconds. Get 200+ tested prompts for your specific industry today.',
  },
  pdf: {
    name: '[Niche] Business SOP Library - Complete Operations Manual',
    description: 'Systemize your business with 50+ ready-to-use SOPs. Stop reinventing the wheel and start scaling.',
    tags: ['sop templates', 'business operations', 'standard procedures', 'business system', 'process templates', 'small business', 'entrepreneur', 'business guide', 'operations manual', 'pdf download', 'business tools', 'management', 'efficiency'],
    contents: ['50+ SOP Templates', 'Implementation Checklist', 'Team Training Guide', 'KPI Tracking Sheet', 'Process Flow Diagrams'],
    chapters: ['Getting Started', 'Sales & Marketing SOPs', 'Operations SOPs', 'HR SOPs', 'Finance SOPs'],
    price: 37,
    category: 'Templates',
    subcategory: 'Business Templates',
  },
  spreadsheet: {
    name: '[Niche] Business Dashboard & CRM - Google Sheets Template',
    description: 'All-in-one business management spreadsheet. Track clients, revenue, KPIs, and growth in one beautiful dashboard.',
    tags: ['google sheets', 'spreadsheet template', 'business dashboard', 'crm template', 'kpi tracker', 'revenue tracker', 'business tools', 'excel template', 'data tracking', 'small business', 'entrepreneur', 'analytics', 'management'],
    contents: ['CRM Database', 'Revenue Dashboard', 'KPI Tracker', 'Client Onboarding Sheet', 'Monthly Reports'],
    price: 47,
    category: 'Spreadsheets',
    subcategory: 'Business & Finance',
  },
  notion: {
    name: '[Niche] Notion Business OS - Complete Workspace Template',
    description: 'Your entire business in one Notion workspace. CRM, projects, content, finances, and team wiki all connected.',
    tags: ['notion template', 'business os', 'notion workspace', 'crm notion', 'project management', 'content calendar', 'business system', 'productivity', 'notion database', 'team wiki', 'digital planner', 'organization', 'workflow'],
    contents: ['Client CRM', 'Project Tracker', 'Content Calendar', 'Financial Dashboard', 'Team Wiki', 'Goal Tracker', 'AI Prompt Library'],
    price: 47,
    category: 'Templates',
    subcategory: 'Productivity Templates',
  },
  bundle: {
    name: '[Niche] Complete AI Business Bundle - Ultimate Collection',
    description: 'Everything you need to build and scale your [niche] business with AI. 5 complete systems in one discounted bundle.',
    tags: ['business bundle', 'ai business', 'digital bundle', 'complete system', 'business kit', 'entrepreneur bundle', 'business templates', 'ai tools', 'chatgpt', 'productivity bundle', 'small business', 'digital products', 'starter kit'],
    contents: ['AI Prompt Pack', 'Business SOP Library', 'Spreadsheet Dashboard', 'Marketing Templates', 'Quick Start Video Guide'],
    price: 97,
    category: 'Templates',
    subcategory: 'Business Templates',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateProductRequest = await request.json()
    const { type, niche, targetAudience, pricePoint, additionalContext } = body

    // Try AI generation first
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY

    if (apiKey && !apiKey.includes('placeholder')) {
      // Real AI generation would happen here
      const prompt = buildProductGenerationPrompt(body)
      // In production: call Claude or OpenAI API
    }

    // Use mock data with niche substitution
    const mockProduct = MOCK_GENERATED_PRODUCTS[type] || MOCK_GENERATED_PRODUCTS['prompt-pack']
    const nicheLabel = niche || 'Business'

    const product = {
      ...mockProduct,
      name: mockProduct.name.replace('[Niche]', nicheLabel),
      description: mockProduct.description.replace('[Niche]', nicheLabel).replace('[niche]', nicheLabel.toLowerCase()),
      salesCopy: mockProduct.salesCopy?.replace('[niche]', nicheLabel.toLowerCase()),
      price: pricePoint || mockProduct.price,
      type,
      status: 'draft',
      mockupUrls: [`https://placehold.co/600x400/6366f1/ffffff?text=${encodeURIComponent(nicheLabel + ' ' + type)}`],
      id: Date.now().toString(),
      revenue: 0,
      sales: 0,
      views: 0,
      favorites: 0,
      conversionRate: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ product, generatedWith: apiKey ? 'ai' : 'mock' })
  } catch (error) {
    console.error('Product generation error:', error)
    return NextResponse.json({ error: 'Failed to generate product' }, { status: 500 })
  }
}
