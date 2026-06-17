// Run with: npx tsx scripts/seed.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const PRODUCTS = [
  {
    name: 'AI Insurance Agent Toolkit',
    type: 'prompt-pack',
    niche: 'insurance',
    description: 'Complete AI toolkit for insurance agents with 250+ prompts for lead generation, client communication, and policy explanations.',
    price: 47,
    status: 'active',
    seo_score: 92,
    sales: 143,
    revenue: 6721,
    views: 3240,
    favorites: 287,
    rating: 4.9,
    tags: ['insurance agent tools', 'AI prompts insurance', 'insurance templates', 'ChatGPT insurance', 'digital download', 'insurance business', 'AI tools', 'productivity templates', 'entrepreneur tools', 'passive income', 'digital products', 'business templates', 'etsy digital'],
  },
  {
    name: 'AI Agency-in-a-Box',
    type: 'notion',
    niche: 'agency',
    description: 'Everything you need to run a successful AI agency. Complete Notion OS with client management, project tracking, and proposal templates.',
    price: 97,
    status: 'active',
    seo_score: 88,
    sales: 89,
    revenue: 8633,
    views: 2180,
    favorites: 203,
    rating: 4.8,
    tags: ['AI agency template', 'agency management', 'notion agency', 'AI business tools', 'digital download', 'agency business', 'client management', 'project tracking', 'entrepreneur tools', 'passive income', 'digital products', 'business OS', 'etsy digital'],
  },
  {
    name: 'Small Business AI Automation Bundle',
    type: 'pdf',
    niche: 'small business',
    description: 'Step-by-step guide to automating your small business with AI. Includes SOPs, workflow templates, and tool recommendations.',
    price: 37,
    status: 'active',
    seo_score: 85,
    sales: 201,
    revenue: 7437,
    views: 4102,
    favorites: 341,
    rating: 4.7,
    tags: ['small business automation', 'AI business guide', 'business templates', 'ChatGPT business', 'digital download', 'small business tools', 'AI automation', 'productivity templates', 'entrepreneur tools', 'business SOPs', 'digital products', 'workflow templates', 'etsy digital'],
  },
  {
    name: 'AI Content Creation System',
    type: 'spreadsheet',
    niche: 'content creation',
    description: 'Complete content creation system with AI-powered content calendar, analytics tracker, and repurposing workflows.',
    price: 37,
    status: 'active',
    seo_score: 90,
    sales: 178,
    revenue: 6586,
    views: 3890,
    favorites: 312,
    rating: 4.8,
    tags: ['content creation tools', 'AI content system', 'content calendar', 'social media templates', 'digital download', 'content creator tools', 'AI writing tools', 'content tracker', 'entrepreneur tools', 'content marketing', 'digital products', 'content planner', 'etsy digital'],
  },
  {
    name: 'AI Recruiting & Hiring Toolkit',
    type: 'prompt-pack',
    niche: 'recruiting',
    description: '200+ AI prompts for recruiters and HR professionals. Job descriptions, interview questions, and candidate evaluation templates.',
    price: 47,
    status: 'active',
    seo_score: 87,
    sales: 112,
    revenue: 5264,
    views: 2650,
    favorites: 198,
    rating: 4.9,
    tags: ['recruiting tools', 'AI hiring prompts', 'HR templates', 'job description templates', 'digital download', 'recruiter tools', 'AI HR tools', 'interview questions', 'entrepreneur tools', 'talent acquisition', 'digital products', 'hiring templates', 'etsy digital'],
  },
  {
    name: 'AI Fitness Coach Business Pack',
    type: 'pdf',
    niche: 'fitness coaching',
    description: 'Launch and scale your fitness coaching business with AI. Includes client intake forms, workout templates, nutrition guides, and marketing prompts.',
    price: 57,
    status: 'active',
    seo_score: 83,
    sales: 94,
    revenue: 5358,
    views: 2100,
    favorites: 167,
    rating: 4.7,
    tags: ['fitness coach tools', 'AI fitness business', 'fitness templates', 'personal trainer tools', 'digital download', 'fitness coaching', 'AI fitness prompts', 'workout templates', 'entrepreneur tools', 'fitness business', 'digital products', 'coach templates', 'etsy digital'],
  },
  {
    name: 'AI Side Hustle Starter Kit',
    type: 'pdf',
    niche: 'side hustle',
    description: 'Everything you need to start and monetize an AI-powered side hustle. 10 proven business models with step-by-step setup guides.',
    price: 27,
    status: 'active',
    seo_score: 91,
    sales: 267,
    revenue: 7209,
    views: 5430,
    favorites: 489,
    rating: 4.8,
    tags: ['side hustle ideas', 'AI side hustle', 'make money with AI', 'passive income ideas', 'digital download', 'side hustle tools', 'AI business ideas', 'income templates', 'entrepreneur tools', 'passive income', 'digital products', 'business starter', 'etsy digital'],
  },
  {
    name: 'Sports Betting Research Toolkit',
    type: 'spreadsheet',
    niche: 'sports betting',
    description: 'Professional sports betting research system. Includes odds tracker, bankroll manager, performance analytics, and AI research prompts.',
    price: 47,
    status: 'active',
    seo_score: 79,
    sales: 156,
    revenue: 7332,
    views: 3780,
    favorites: 298,
    rating: 4.6,
    tags: ['sports betting tools', 'betting tracker', 'odds tracker spreadsheet', 'bankroll management', 'digital download', 'betting research', 'sports analytics', 'betting journal', 'sports betting system', 'betting tools', 'digital products', 'sports research', 'etsy digital'],
  },
  {
    name: 'Notion AI Business Operating System',
    type: 'notion',
    niche: 'business',
    description: 'The ultimate Notion workspace for AI-powered businesses. Complete OS with CRM, project management, content calendar, finances, and goal tracking.',
    price: 67,
    status: 'active',
    seo_score: 94,
    sales: 203,
    revenue: 13601,
    views: 4820,
    favorites: 521,
    rating: 4.9,
    tags: ['notion business template', 'notion OS', 'business operating system', 'notion CRM', 'digital download', 'notion template', 'AI business tools', 'productivity system', 'entrepreneur tools', 'notion dashboard', 'digital products', 'business management', 'etsy digital'],
  },
  {
    name: 'AI Business Growth Vault',
    type: 'pdf',
    niche: 'business growth',
    description: 'The ultimate premium bundle for AI-powered business growth. Includes all toolkits: Insurance, Agency, Automation, Recruiting, Content, and Business OS.',
    price: 297,
    status: 'active',
    seo_score: 96,
    sales: 67,
    revenue: 19899,
    views: 2890,
    favorites: 412,
    rating: 5.0,
    tags: ['AI business bundle', 'business growth tools', 'AI toolkit bundle', 'business templates bundle', 'digital download', 'AI tools collection', 'premium business tools', 'entrepreneur bundle', 'business vault', 'AI business pack', 'digital products', 'business starter kit', 'etsy digital'],
  },
]

async function seed() {
  console.log('Seeding database...\n')

  // Check if products already exist
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  if (count && count > 0) {
    console.log(`Database already has ${count} products. Skipping seed.`)
    console.log('   To reseed, truncate the products table first.\n')
    process.exit(0)
  }

  const { data, error } = await supabase.from('products').insert(
    PRODUCTS.map(p => ({
      ...p,
      tags: JSON.stringify(p.tags),
      contents: JSON.stringify([]),
      chapters: JSON.stringify([]),
    }))
  ).select()

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Seeded ${data?.length} products successfully!\n`)
  data?.forEach(p => console.log(`   - ${p.name} — $${p.price}`))
  console.log('\nYour database is ready!')
}

seed()
