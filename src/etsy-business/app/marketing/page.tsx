'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const TABS = ['Pinterest', 'Blog', 'Email', 'Social Media'] as const
type Tab = typeof TABS[number]

const SAMPLE_CONTENT: Record<Tab, { title: string; content: string; hashtags?: string[] }[]> = {
  Pinterest: [
    { title: 'Pin: AI Toolkit Reveal', content: '5 AI tools that helped me make $4,320 on Etsy this month. The secret? This AI Insurance Agent Toolkit. Swipe to see what\'s inside...', hashtags: ['#aitools', '#etsyseller', '#passiveincome', '#digitalproducts', '#sidehustle'] },
    { title: 'Story Pin: Before & After', content: 'Before AI: Spending 3 hours writing emails. After AI: 10 minutes with our prompt templates. Download now →', hashtags: ['#productivity', '#ChatGPT', '#entrepreneur'] },
  ],
  Blog: [
    { title: 'How I Made $22,140 in 30 Days Selling AI Prompts on Etsy', content: 'In this post, I\'m going to share the exact strategy I used to build a passive income stream selling digital AI products on Etsy. From product research to SEO optimization, here\'s everything you need to know...\n\n## What Are AI Prompt Packs?\n\nAI prompt packs are collections of carefully crafted prompts for ChatGPT, Claude, and other AI tools...' },
    { title: '10 Best-Selling Digital Products on Etsy in 2024 (with AI)', content: 'The digital product market on Etsy is booming. Here are the top 10 categories with the highest demand and lowest competition...' },
  ],
  Email: [
    { title: 'Subject: I made $197 while sleeping (here\'s how)', content: 'Hey [First Name],\n\nYesterday morning I woke up to 3 new sales notifications.\n\n$197 in passive income while I slept.\n\nHere\'s the exact system I use:\n\n1. Create AI-powered digital products\n2. Optimize with the right keywords\n3. Let Etsy\'s search algorithm do the work\n\nWant the same system? Get the AI Business Growth Vault →\n\n[CTA BUTTON]\n\nBest,\n[Your Name]' },
    { title: 'Subject: Limited time: 60% off ends tonight', content: 'Hi [First Name],\n\nJust a quick reminder that our Spring Sale ends at midnight.\n\nThe AI Business Growth Vault - everything you need to build a profitable Etsy business - is 60% off.\n\nRegular price: $497\nToday only: $197\n\nGrab it before midnight →' },
  ],
  'Social Media': [
    { title: 'Twitter/X Thread', content: 'I quit my 9-5 using Etsy digital products. Here\'s the exact blueprint (thread 🧵):\n\n1/ First, I picked a niche: AI tools for business owners\n\n2/ Created 3 products in 1 weekend using AI\n\n3/ Optimized SEO with 13 power keywords\n\n4/ Month 1: $840\nMonth 2: $2,200\nMonth 3: $4,300\n\nFull system in bio 👇', hashtags: ['#entrepreneur', '#passiveincome', '#etsyseller'] },
    { title: 'Instagram Caption', content: 'My Etsy dashboard at 7am on a Tuesday... 🔔\n\nPassive income from digital products hits different when you remember you made sales WHILE SLEEPING.\n\nThis AI toolkit is what got me here. Link in bio to get yours.', hashtags: ['#digitalproducts', '#passiveincome', '#etsyseller', '#sidehustle', '#workfromhome'] },
  ],
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Pinterest')
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0].id)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const content = SAMPLE_CONTENT[activeTab]

  const copyContent = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1500))
    setGenerating(false)
  }

  return (
    <div>
      <Header title="Marketing Hub" subtitle="AI-generated content for every platform" />
      <div className="p-6 space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                {MOCK_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate All Content'}
            </Button>
          </div>

          <div className="flex gap-1 border-b border-gray-200">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {content.map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm text-gray-900">{item.title}</div>
                  <button onClick={() => copyContent(item.content + (item.hashtags ? '\n\n' + item.hashtags.join(' ') : ''), i)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                    {copied === i ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{item.content}</pre>
                {item.hashtags && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.hashtags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
