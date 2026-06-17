'use client'

import { useState } from 'react'
import { Megaphone, Sparkles, Copy, Check, Image, FileText, Mail, Share2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const CONTENT_TYPES = [
  { id: 'pinterest', label: 'Pinterest Pin', icon: <Image className="w-4 h-4" />, color: 'red' },
  { id: 'blog', label: 'Blog Article', icon: <FileText className="w-4 h-4" />, color: 'blue' },
  { id: 'email', label: 'Email Sequence', icon: <Mail className="w-4 h-4" />, color: 'green' },
  { id: 'social', label: 'Social Post', icon: <Share2 className="w-4 h-4" />, color: 'purple' },
]

const MOCK_CONTENT: Record<string, string> = {
  pinterest: `🤖 Stop doing this manually...

Your [Product Name] can be on autopilot with AI.

Inside: 200+ prompts that do the heavy lifting for you.

✅ Save 10+ hours/week
✅ Look like an expert instantly
✅ Clients won't believe it's AI

Link in bio → Digital download, instant access

#AIBusiness #ChatGPT #Entrepreneur #SideHustle #DigitalDownload #PassiveIncome #BusinessTools #AIPrompts`,

  blog: `# How AI is Transforming [Industry] Businesses in 2024

The landscape of [industry] is changing faster than ever before. AI tools like ChatGPT and Claude are giving entrepreneurs and professionals unprecedented capabilities — but only if you know how to use them effectively.

## The Problem Most [Industry] Professionals Face

Most people spend 60-70% of their time on repetitive tasks that AI could handle in seconds. Writing emails, creating content, drafting proposals, managing client communication — all of these can be dramatically accelerated.

## The Solution: AI Prompt Libraries

That's exactly why we created our [Product Name]. Instead of spending weeks learning prompt engineering, you get 200+ battle-tested prompts ready to use today.

## What You Get

- **Instant Results**: Copy, paste, customize, done
- **Professional Quality**: Every prompt refined for maximum output quality
- **Industry-Specific**: Built specifically for [industry] professionals

## How to Get Started

1. Download the prompt library (instant access)
2. Open ChatGPT or Claude
3. Copy your first prompt
4. Watch AI do the work

**Ready to transform your business?** [Download Now →]`,

  email: `**Email 1 (Day 0): Welcome + Quick Win**
Subject: Your AI toolkit is ready (start here first)

Hey [First Name],

Your [Product Name] is ready! Before you dive in, here's the #1 prompt 99% of our customers use first:

[FIRST QUICK WIN PROMPT]

That's your homework for the next 10 minutes. Reply and tell me what AI generated for you!

**Email 2 (Day 2): Social Proof**
Subject: "[Name] made $X in her first week"

Hey [First Name], I want to share a quick story...

[CUSTOMER SUCCESS STORY]

The difference? She used Prompt #47 from your toolkit.

**Email 3 (Day 5): Advanced Tips**
Subject: The "hidden" prompts most people miss

Hey [First Name], most people start with the basics...

But the REAL power is in the advanced section.

Here are my top 3 underrated prompts: [TIPS]`,

  social: `🚀 I saved 15 hours this week using AI.

Here's exactly how:

Monday: Used AI to write all 5 client proposals (2 hrs → 15 min)
Tuesday: AI drafted my entire content calendar (3 hrs → 20 min)
Wednesday: AI handled all my email follow-ups (2 hrs → 10 min)

The secret? Having the RIGHT prompts.

Not random ChatGPT tips from Twitter.

Actual, tested prompts built for my specific business.

That's what our [Product Name] gives you. 200+ prompts, ready to copy and paste.

Link in bio → instant download

What would YOU do with 15 extra hours? 👇`,
}

export default function MarketingPage() {
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0].id)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['pinterest'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [content, setContent] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 1800))
    const generated: Record<string, string> = {}
    selectedTypes.forEach(type => {
      generated[type] = MOCK_CONTENT[type] || 'Content generated successfully!'
    })
    setContent(generated)
    setIsGenerating(false)
  }

  const handleCopy = (type: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const product = MOCK_PRODUCTS.find(p => p.id === selectedProduct)!

  return (
    <div>
      <Header title="Content Marketing Hub" subtitle="Generate content across all platforms with AI" />

      <div className="p-6 space-y-6">
        {/* Generator */}
        <Card>
          <CardHeader><CardTitle>AI Content Generator</CardTitle></CardHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Select
                label="Select Product"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                options={MOCK_PRODUCTS.map(p => ({ value: p.id, label: p.name }))}
              />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Content Types</p>
                <div className="space-y-2">
                  {CONTENT_TYPES.map(({ id, label, icon }) => (
                    <label key={id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedTypes.includes(id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(id)}
                        onChange={() => setSelectedTypes(prev =>
                          prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
                        )}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-indigo-600">{icon}</span>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleGenerate} isLoading={isGenerating} disabled={selectedTypes.length === 0}>
                <Sparkles className="w-4 h-4" />
                Generate Content
              </Button>
            </div>

            <div className="lg:col-span-2">
              {Object.keys(content).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(content).map(([type, text]) => {
                    const typeConfig = CONTENT_TYPES.find(t => t.id === type)!
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">{typeConfig.icon}</span>
                            <span className="text-sm font-semibold text-gray-900">{typeConfig.label}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(type, text)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copied === type ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === type ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed font-mono text-xs border border-gray-100">
                          {text.replace('[Product Name]', product.name).replace('[product name]', product.name)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="text-center py-12">
                    <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Select a product and content types, then click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
