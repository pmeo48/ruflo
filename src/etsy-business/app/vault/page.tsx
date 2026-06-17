import { Check, Star, Lock, Zap, Users, RefreshCw, Shield } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const FEATURES = [
  'All 10 Best-Selling AI Product Systems',
  '1,000+ Carefully Crafted AI Prompts',
  '50+ Done-For-You Business Templates',
  'Exclusive AI Business Masterclass (3 hrs)',
  'Private Community Access (lifetime)',
  'Quarterly Product Updates',
  'SEO Optimization Guides for Every Niche',
  'Launch Checklist & Timeline Templates',
  'Email Marketing Sequences (done-for-you)',
  'Pinterest Content Calendar (3 months)',
]

const TESTIMONIALS = [
  { name: 'Sarah K.', handle: '@sarah_etsy_wins', text: 'Made $3,200 in my first month using the vault. The prompts alone are worth 10x the price.', rating: 5 },
  { name: 'Marcus T.', handle: '@marcusdigital', text: 'Replaced my salary in 6 months. The business templates cut my setup time from weeks to days.', rating: 5 },
  { name: 'Priya M.', handle: '@priyasidehuslte', text: 'The SEO guides helped my first product hit page 1 in 2 weeks. Game changer.', rating: 5 },
]

const UPSELL_FUNNEL = [
  { step: 1, price: '$27', label: 'AI Prompt Pack', desc: 'Entry offer — 250 AI prompts' },
  { step: 2, price: '$97', label: 'AI Agency Bundle', desc: 'Upsell 1 — complete agency system' },
  { step: 3, price: '$297', label: 'Business Growth Vault', desc: 'Core offer — everything included' },
  { step: 4, price: '$497', label: 'VIP Coaching Add-on', desc: 'Order bump — 1-on-1 session' },
]

export default function VaultPage() {
  const vaultProduct = MOCK_PRODUCTS.find(p => p.id === '10')!

  return (
    <div>
      <Header title="AI Business Growth Vault" subtitle="Premium bundle sales page & funnel overview" />
      <div className="p-6 space-y-8 max-w-5xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 text-white">
          <div className="relative z-10">
            <Badge variant="yellow" className="mb-4">LIMITED TIME — 60% OFF</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              The AI Business Growth Vault
            </h1>
            <p className="text-lg text-indigo-200 mb-6 max-w-2xl">
              Everything you need to build a 6-figure AI digital product business on Etsy. 
              1,000+ prompts, 50+ templates, and complete business systems — in one vault.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div>
                <div className="text-5xl font-black text-white">$197</div>
                <div className="text-indigo-300 line-through text-lg">$497</div>
              </div>
              <div className="text-sm text-indigo-200">
                <div className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />Instant digital download</div>
                <div className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />Lifetime access + updates</div>
                <div className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />30-day money-back guarantee</div>
              </div>
            </div>
            <Button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-lg px-8 py-3 font-bold">
              Get Instant Access — $197
            </Button>
            <div className="flex items-center gap-4 mt-4 text-xs text-indigo-300">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Secure checkout</span>
              <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />30-day guarantee</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />92 customers this week</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="relative">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-700 italic mb-3">"{t.text}"</p>
              <div>
                <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-400">{t.handle}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Features */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Everything Inside the Vault</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Products Included */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">All 10 Products Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_PRODUCTS.filter(p => p.id !== '10').map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400">Value: ${p.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-indigo-900">Total Value</div>
              <div className="text-2xl font-black text-indigo-900">$497</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-indigo-900">Your Price Today</div>
              <div className="text-2xl font-black text-green-600">$197</div>
            </div>
          </div>
        </Card>

        {/* Funnel Overview */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sales Funnel Overview</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-indigo-100" />
            <div className="space-y-4">
              {UPSELL_FUNNEL.map((step) => (
                <div key={step.step} className="relative pl-16">
                  <div className="absolute left-5 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{step.step}</div>
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{step.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
                    </div>
                    <div className="text-xl font-black text-indigo-600">{step.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800">Full Funnel Revenue Potential</div>
            <div className="text-xs text-green-600 mt-1">Average cart value: $284 · Conversion rate: 2.1% · Monthly revenue: $14,200</div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <div className="text-2xl font-bold text-gray-900 mb-2">Ready to Build Your AI Business?</div>
          <p className="text-gray-500 mb-6">Join 92+ entrepreneurs who got the vault this week.</p>
          <Button className="text-lg px-10 py-3">
            <Zap className="w-5 h-5" />
            Get the Vault for $197 — Save $300
          </Button>
          <div className="text-sm text-gray-400 mt-3">30-day money-back guarantee. No questions asked.</div>
        </div>
      </div>
    </div>
  )
}
