import { ProductType, GenerateProductRequest } from './types'

export const PRODUCT_TYPE_CONFIGS: Record<ProductType, {
  label: string
  description: string
  icon: string
  priceRange: [number, number]
  exampleProducts: string[]
}> = {
  pdf: {
    label: 'PDF Guide / Ebook',
    description: 'Comprehensive guides, SOPs, workbooks, and educational content',
    icon: '📄',
    priceRange: [9, 47],
    exampleProducts: ['SOP Library', 'Business Playbook', 'Step-by-step Guide', 'Workbook'],
  },
  spreadsheet: {
    label: 'Spreadsheet / Tracker',
    description: 'Excel/Google Sheets templates, dashboards, and trackers',
    icon: '📊',
    priceRange: [17, 97],
    exampleProducts: ['Business Dashboard', 'CRM Tracker', 'Budget Planner', 'KPI Dashboard'],
  },
  notion: {
    label: 'Notion Template',
    description: 'Complete Notion workspaces, databases, and business systems',
    icon: '📋',
    priceRange: [27, 127],
    exampleProducts: ['Business OS', 'Project Manager', 'Content Hub', 'CRM System'],
  },
  'prompt-pack': {
    label: 'AI Prompt Pack',
    description: 'ChatGPT & Claude prompt libraries for specific use cases',
    icon: '🤖',
    priceRange: [9, 37],
    exampleProducts: ['Marketing Prompts', 'Sales Scripts', 'Recruiting Prompts', 'Writing Prompts'],
  },
  bundle: {
    label: 'Product Bundle',
    description: 'Multiple products bundled together at a discount',
    icon: '📦',
    priceRange: [47, 297],
    exampleProducts: ['Complete Business Kit', 'Mega Bundle', 'Starter Pack', 'Premium Collection'],
  },
}

export const ETSY_CATEGORIES = [
  {
    name: 'Templates',
    subcategories: ['Business Templates', 'Marketing Templates', 'Productivity Templates', 'Health & Wellness', 'Education Templates'],
  },
  {
    name: 'Spreadsheets',
    subcategories: ['Business & Finance', 'Project Management', 'Health & Fitness', 'Sports', 'Personal Finance'],
  },
  {
    name: 'Planners',
    subcategories: ['Business Planners', 'Daily Planners', 'Goal Planners', 'Budget Planners'],
  },
  {
    name: 'Guides',
    subcategories: ['Business Guides', 'How-to Guides', 'Reference Guides'],
  },
]

export function buildProductGenerationPrompt(request: GenerateProductRequest): string {
  const config = PRODUCT_TYPE_CONFIGS[request.type]
  return `Create a complete Etsy digital product for the "${request.type}" category.

Product Type: ${config.label}
${request.niche ? `Niche/Industry: ${request.niche}` : ''}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}
${request.pricePoint ? `Price Point: $${request.pricePoint}` : `Suggested Price Range: $${config.priceRange[0]}-$${config.priceRange[1]}`}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ''}

Generate a JSON response with:
{
  "name": "Product name (catchy, benefit-focused)",
  "description": "2-3 sentence description",
  "tags": ["tag1", "tag2", ...up to 13 tags],
  "contents": ["item1", "item2", ...list of what's included],
  "chapters": ["chapter1", ...if applicable],
  "salesCopy": "2-3 sentence sales copy with urgency",
  "price": number,
  "category": "Etsy category",
  "subcategory": "Etsy subcategory"
}`
}
