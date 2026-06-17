'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, FileText, Table2, BookOpen, Bot, Package } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ProductType } from '@/lib/types'
import Link from 'next/link'
import { clsx } from 'clsx'

const PRODUCT_TYPES: { type: ProductType; label: string; description: string; icon: React.ReactNode; examples: string[] }[] = [
  {
    type: 'pdf',
    label: 'PDF Guide / Ebook',
    description: 'Comprehensive guides, SOPs, workbooks, and educational content',
    icon: <FileText className="w-5 h-5" />,
    examples: ['SOP Library', 'Business Playbook', 'Workbook', 'Checklist Pack'],
  },
  {
    type: 'spreadsheet',
    label: 'Spreadsheet / Tracker',
    description: 'Excel/Google Sheets templates, dashboards, and trackers',
    icon: <Table2 className="w-5 h-5" />,
    examples: ['Business Dashboard', 'CRM Tracker', 'Budget Planner', 'KPI Dashboard'],
  },
  {
    type: 'notion',
    label: 'Notion Template',
    description: 'Complete Notion workspaces, databases, and business systems',
    icon: <BookOpen className="w-5 h-5" />,
    examples: ['Business OS', 'Project Manager', 'Content Hub', 'CRM System'],
  },
  {
    type: 'prompt-pack',
    label: 'AI Prompt Pack',
    description: 'ChatGPT & Claude prompt libraries for specific use cases',
    icon: <Bot className="w-5 h-5" />,
    examples: ['Marketing Prompts', 'Sales Scripts', 'Recruiting Prompts', 'Writing Prompts'],
  },
  {
    type: 'bundle',
    label: 'Product Bundle',
    description: 'Multiple products bundled together at a discount',
    icon: <Package className="w-5 h-5" />,
    examples: ['Complete Business Kit', 'Mega Bundle', 'Starter Pack'],
  },
]

export default function NewProductPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<ProductType | null>(null)
  const [niche, setNiche] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [pricePoint, setPricePoint] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProduct, setGeneratedProduct] = useState<any>(null)
  const [step, setStep] = useState(1)

  const handleGenerate = async () => {
    if (!selectedType) return
    setIsGenerating(true)
    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          niche,
          targetAudience,
          pricePoint: pricePoint ? Number(pricePoint) : undefined,
          additionalContext,
        }),
      })
      const data = await response.json()
      setGeneratedProduct(data.product)
      setStep(3)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <Header
        title="AI Product Builder"
        subtitle="Generate a new digital product with AI in seconds"
        actions={
          <Link href="/products">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Product Type' },
            { n: 2, label: 'Details' },
            { n: 3, label: 'Review & Create' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                step >= n ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
              )}>
                {n}
              </div>
              <span className={clsx('text-sm', step >= n ? 'text-gray-900 font-medium' : 'text-gray-400')}>
                {label}
              </span>
              {n < 3 && <div className={clsx('w-8 h-0.5 rounded', step > n ? 'bg-indigo-600' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        {/* Step 1: Product Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Product Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {PRODUCT_TYPES.map(({ type, label, description, icon, examples }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all duration-200',
                    selectedType === type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      selectedType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    )}>
                      {icon}
                    </div>
                    <span className="font-semibold text-gray-900">{label}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{description}</p>
                  <div className="flex flex-wrap gap-1">
                    {examples.map(ex => (
                      <span key={ex} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ex}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} disabled={!selectedType}>
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-5 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
            <Input
              label="Niche / Industry"
              placeholder="e.g., Insurance, Fitness, Real Estate, E-commerce"
              value={niche}
              onChange={e => setNiche(e.target.value)}
            />
            <Input
              label="Target Audience"
              placeholder="e.g., Small business owners, Insurance agents, Freelancers"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
            />
            <Input
              label="Price Point ($)"
              type="number"
              placeholder="e.g., 27, 47, 97"
              value={pricePoint}
              onChange={e => setPricePoint(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Additional Context</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Any specific features, angles, or requirements for this product..."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={handleGenerate} isLoading={isGenerating}>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && generatedProduct && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Generated Product</h2>
            <Card>
              <h3 className="font-bold text-xl text-gray-900 mb-2">{generatedProduct.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{generatedProduct.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="font-bold text-indigo-600 text-lg">${generatedProduct.price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm font-medium text-gray-900">{generatedProduct.category}</p>
                </div>
              </div>
              {generatedProduct.contents && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">What's Included</p>
                  <ul className="space-y-1">
                    {generatedProduct.contents.map((item: string) => (
                      <li key={item} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-green-500">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {generatedProduct.tags && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedProduct.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>← Regenerate</Button>
              <Button onClick={() => router.push('/products')}>
                Save Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
