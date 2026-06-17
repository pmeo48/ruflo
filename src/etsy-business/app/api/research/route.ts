import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    marketSize: 2400000,
    avgPrice: 34.20,
    growthRate: 34,
    competitors: [
      { shop: 'AIPromptsShop', product: 'ChatGPT Business Prompts Pack', price: 24, sales: 2840, rating: 4.9, opportunity: 'high' },
      { shop: 'DigitalTemplateHub', product: 'Notion Business OS Template', price: 39, sales: 1920, rating: 4.8, opportunity: 'medium' },
      { shop: 'ContentCreatorTools', product: 'AI Social Media Content Pack', price: 17, sales: 4200, rating: 4.7, opportunity: 'high' },
      { shop: 'EntrepreneurVault', product: 'AI Agency Starter Bundle', price: 67, sales: 890, rating: 4.9, opportunity: 'medium' },
    ],
    recommendations: [
      'AI prompts market growing 34% MoM — strong opportunity',
      'Notion templates $40-60 outperform lower-priced by 2.3x revenue',
      'Bundles with 5+ products see 47% higher conversion',
      'Top sellers use all 13 Etsy tags',
    ],
  })
}
