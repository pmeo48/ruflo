import { Star, Shield, Zap, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/analytics'

const VAULT_PRODUCT = MOCK_PRODUCTS.find(p => p.id === '10')!

const INCLUDES = [
  { icon: '🤖', label: 'AI Insurance Agent Toolkit', value: '$27' },
  { icon: '🏢', label: 'AI Agency-in-a-Box', value: '$97' },
  { icon: '⚡', label: 'Small Business AI Automation Bundle', value: '$37' },
  { icon: '✍️', label: 'AI Content Creation System', value: '$29' },
  { icon: '👥', label: 'AI Recruiting & Hiring Toolkit', value: '$47' },
  { icon: '💪', label: 'AI Fitness Coach Business Pack', value: '$67' },
  { icon: '💡', label: 'AI Side Hustle Starter Kit', value: '$19' },
  { icon: '📊', label: 'Sports Betting Research Toolkit', value: '$37' },
  { icon: '📋', label: 'Notion AI Business Operating System', value: '$47' },
  { icon: '🎓', label: 'Exclusive AI Masterclass', value: '$197' },
  { icon: '👑', label: 'Private Community Access', value: 'Priceless' },
  { icon: '♾️', label: 'Lifetime Updates', value: 'Forever' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Digital Entrepreneur', text: 'Made back my investment in 3 days. The AI prompts alone are worth 10x the price.', rating: 5 },
  { name: 'James K.', role: 'Agency Owner', text: 'I used the Agency-in-a-Box to launch my AI consulting agency. First client within a week.', rating: 5 },
  { name: 'Maria L.', role: 'Side Hustler', text: 'The Side Hustle Starter Kit helped me make $2,400 my first month. Life-changing.', rating: 5 },
]

export default function VaultPage() {
  const originalValue = INCLUDES.filter(i => i.value.startsWith('$')).reduce((sum, i) => sum + Number(i.value.replace('$', '')), 0)

  return (
    <div>
      <Header title="AI Business Growth Vault" subtitle="Premium collection · Limited time offer" />

      <div className="p-6 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="yellow" className="bg-yellow-400 text-yellow-900">LIMITED TIME</Badge>
              <Badge variant="gray" className="bg-white/20 text-white border-0">60% OFF</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-3">AI Business Growth Vault</h1>
            <p className="text-indigo-200 text-lg mb-6 max-w-2xl">
              Everything you need to build a 6-figure AI-powered business. 9 complete systems, 1,000+ prompts, exclusive masterclass, and private community.
            </p>
            <div className="flex items-end gap-4 mb-6">
              <div>
                <p className="text-indigo-300 text-sm line-through">${originalValue} value</p>
                <p className="text-5xl font-bold">${VAULT_PRODUCT.price}</p>
              </div>
              <div className="text-indigo-200 text-sm pb-2">
                <p>One-time payment</p>
                <p>Instant download</p>
              </div>
            </div>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              Get Instant Access
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: `${VAULT_PRODUCT.sales}+`, label: 'Happy Customers', icon: <Users className="w-5 h-5 text-indigo-600" /> },
            { value: `${VAULT_PRODUCT.avgRating}★`, label: 'Average Rating', icon: <Star className="w-5 h-5 text-yellow-500" /> },
            { value: '1,000+', label: 'AI Prompts', icon: <Zap className="w-5 h-5 text-purple-600" /> },
            { value: formatCurrency(VAULT_PRODUCT.revenue), label: 'Revenue Generated', icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
          ].map(({ value, label, icon }) => (
            <Card key={label} className="text-center">
              <div className="flex justify-center mb-2">{icon}</div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </Card>
          ))}
        </div>

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle>Everything Included</CardTitle>
            <Badge variant="green">Total Value: ${originalValue}+</Badge>
          </CardHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {INCLUDES.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-xl">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600 flex-shrink-0">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Testimonials */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Customers Are Saying</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <Card key={name} hover>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 italic mb-4">"{text}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 text-center py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Build Your AI Business?</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">Join 92+ entrepreneurs who are already using the AI Business Growth Vault to build 6-figure digital product businesses.</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Button size="lg">
              Get Instant Access — $197
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              30-day money back guarantee
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
