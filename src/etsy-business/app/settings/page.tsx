'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Settings, Key, Plug, Zap, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

type Tab = 'store' | 'apikeys' | 'integrations' | 'automation'

interface FormSettings {
  storeName: string
  storeTagline: string
  storeUrl: string
  storeEmail: string
  defaultCurrency: string
  defaultProductPrice: string
  taxRate: string
  openaiKey: string
  anthropicKey: string
  supabaseUrl: string
  supabaseAnonKey: string
  stripePublishableKey: string
  resendApiKey: string
  fromEmail: string
  fromName: string
  pinterestAccessToken: string
  pinterestBoardId: string
  etsyApiKey: string
  etsyShopId: string
  autoGenerateImages: string
  autoPostPinterest: string
  autoSendEmails: string
  autoSeoRefresh: string
  autoBundleSuggest: string
}

type IntegrationStatus = 'ok' | 'error' | 'not_configured' | 'idle' | 'testing'

interface IntegrationResult {
  status: IntegrationStatus
  message: string
}

const INTEGRATIONS = [
  { key: 'openai', label: 'OpenAI', emoji: '🤖' },
  { key: 'anthropic', label: 'Anthropic', emoji: '🧠' },
  { key: 'supabase', label: 'Supabase', emoji: '🗄️' },
  { key: 'stripe', label: 'Stripe', emoji: '💳' },
  { key: 'resend', label: 'Resend', emoji: '📧' },
  { key: 'etsy', label: 'Etsy', emoji: '🛍️' },
  { key: 'pinterest', label: 'Pinterest', emoji: '📌' },
]

const DEFAULTS: FormSettings = {
  storeName: 'AI Digital Products',
  storeTagline: 'Premium AI tools for modern professionals',
  storeUrl: '',
  storeEmail: '',
  defaultCurrency: 'USD',
  defaultProductPrice: '27',
  taxRate: '0',
  openaiKey: '',
  anthropicKey: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  stripePublishableKey: '',
  resendApiKey: '',
  fromEmail: '',
  fromName: '',
  pinterestAccessToken: '',
  pinterestBoardId: '',
  etsyApiKey: '',
  etsyShopId: '',
  autoGenerateImages: 'false',
  autoPostPinterest: 'false',
  autoSendEmails: 'true',
  autoSeoRefresh: 'false',
  autoBundleSuggest: 'false',
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('store')
  const [form, setForm] = useState<FormSettings>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [integrations, setIntegrations] = useState<Record<string, IntegrationResult>>(
    Object.fromEntries(INTEGRATIONS.map(i => [i.key, { status: 'idle', message: '' }]))
  )
  const [testingAll, setTestingAll] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) return
      const { settings } = await res.json()
      setForm(prev => ({ ...prev, ...settings }))
    } catch {
      // silently use defaults
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  function set(key: keyof FormSettings, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save(fields: Partial<FormSettings>) {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      setSaveMsg(data.message ?? (data.success ? 'Saved successfully' : 'Error saving'))
    } catch {
      setSaveMsg('Failed to save settings')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  async function testConnection(service: string) {
    setIntegrations(prev => ({ ...prev, [service]: { status: 'testing', message: 'Testing...' } }))
    try {
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      })
      const data = await res.json()
      const result = data.results[service]
      setIntegrations(prev => ({ ...prev, [service]: result ?? { status: 'error', message: 'No result' } }))
    } catch {
      setIntegrations(prev => ({ ...prev, [service]: { status: 'error', message: 'Request failed' } }))
    }
  }

  async function testAll() {
    setTestingAll(true)
    try {
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'all' }),
      })
      const data = await res.json()
      setIntegrations(prev => ({ ...prev, ...data.results }))
    } catch {
      // ignore
    } finally {
      setTestingAll(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'store', label: 'Store Info', icon: <Settings className="w-4 h-4" /> },
    { id: 'apikeys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Plug className="w-4 h-4" /> },
    { id: 'automation', label: 'Automation', icon: <Zap className="w-4 h-4" /> },
  ]

  function StatusBadge({ status }: { status: IntegrationStatus }) {
    if (status === 'ok') return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
    if (status === 'not_configured') return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertCircle className="w-3.5 h-3.5" /> Not configured</span>
    if (status === 'error') return <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><XCircle className="w-3.5 h-3.5" /> Error</span>
    if (status === 'testing') return <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</span>
    return <span className="text-xs text-gray-400">—</span>
  }

  function Toggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const checked = value === 'true'
    return (
      <button
        type="button"
        onClick={() => onChange(checked ? 'false' : 'true')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your store, integrations, and automation preferences.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {saveMsg && (
          <div className={`px-4 py-2 rounded-lg text-sm ${saveMsg.includes('Error') || saveMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {saveMsg}
          </div>
        )}

        {/* Tab: Store Info */}
        {activeTab === 'store' && (
          <Card>
            <CardHeader><CardTitle>Store Information</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input label="Store Name" value={form.storeName} onChange={e => set('storeName', e.target.value)} />
              <Input label="Store Tagline" value={form.storeTagline} onChange={e => set('storeTagline', e.target.value)} />
              <Input label="Store URL" type="url" placeholder="https://yourstore.etsy.com" value={form.storeUrl} onChange={e => set('storeUrl', e.target.value)} helperText="Used for UTM tracking links" />
              <Input label="Contact Email" type="email" value={form.storeEmail} onChange={e => set('storeEmail', e.target.value)} />
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Default Currency</label>
                  <select
                    value={form.defaultCurrency}
                    onChange={e => set('defaultCurrency', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>
                <Input label="Default Product Price" type="number" min="0" step="0.01" value={form.defaultProductPrice} onChange={e => set('defaultProductPrice', e.target.value)} />
                <Input label="Tax Rate %" type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} />
              </div>
              <div className="pt-2">
                <Button onClick={() => save({ storeName: form.storeName, storeTagline: form.storeTagline, storeUrl: form.storeUrl, storeEmail: form.storeEmail, defaultCurrency: form.defaultCurrency, defaultProductPrice: form.defaultProductPrice, taxRate: form.taxRate })} isLoading={saving}>
                  Save Store Settings
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tab: API Keys */}
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              Sensitive keys are masked. To update a key, type a new value. Keys are stored encrypted in Supabase.
            </div>

            <Card>
              <CardHeader><CardTitle>AI Generation</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="OpenAI API Key" type="password" placeholder="sk-••••••••" value={form.openaiKey} onChange={e => set('openaiKey', e.target.value)} />
                <Input label="Anthropic API Key" type="password" placeholder="sk-ant-••••••••" value={form.anthropicKey} onChange={e => set('anthropicKey', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Database</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="Supabase URL" placeholder="https://xxxx.supabase.co" value={form.supabaseUrl} onChange={e => set('supabaseUrl', e.target.value)} />
                <Input label="Supabase Anon Key" type="password" placeholder="eyJ••••••••" value={form.supabaseAnonKey} onChange={e => set('supabaseAnonKey', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="Stripe Publishable Key" placeholder="pk_live_••••••••" value={form.stripePublishableKey} onChange={e => set('stripePublishableKey', e.target.value)} />
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  Set <code className="font-mono bg-white px-1 rounded">STRIPE_SECRET_KEY</code> in <code className="font-mono bg-white px-1 rounded">.env.local</code> — never stored in the database for security reasons.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Email</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="Resend API Key" type="password" placeholder="re_••••••••" value={form.resendApiKey} onChange={e => set('resendApiKey', e.target.value)} />
                <Input label="From Email" type="email" placeholder="hello@yourdomain.com" value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)} />
                <Input label="From Name" placeholder="Your Store Name" value={form.fromName} onChange={e => set('fromName', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Social</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="Pinterest Access Token" type="password" placeholder="••••••••" value={form.pinterestAccessToken} onChange={e => set('pinterestAccessToken', e.target.value)} />
                <Input label="Pinterest Board ID" placeholder="123456789" value={form.pinterestBoardId} onChange={e => set('pinterestBoardId', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Etsy</CardTitle></CardHeader>
              <div className="space-y-4">
                <Input label="Etsy API Key" placeholder="keystring_••••••••" value={form.etsyApiKey} onChange={e => set('etsyApiKey', e.target.value)} />
                <Input label="Etsy Shop ID" placeholder="12345678" value={form.etsyShopId} onChange={e => set('etsyShopId', e.target.value)} />
              </div>
            </Card>

            <Button onClick={() => save({ openaiKey: form.openaiKey, anthropicKey: form.anthropicKey, supabaseUrl: form.supabaseUrl, supabaseAnonKey: form.supabaseAnonKey, stripePublishableKey: form.stripePublishableKey, resendApiKey: form.resendApiKey, pinterestAccessToken: form.pinterestAccessToken, pinterestBoardId: form.pinterestBoardId, etsyApiKey: form.etsyApiKey, etsyShopId: form.etsyShopId })} isLoading={saving}>
              Save API Settings
            </Button>
          </div>
        )}

        {/* Tab: Integrations */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={testAll} isLoading={testingAll}>
                <RefreshCw className="w-4 h-4" />
                Test All Connections
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INTEGRATIONS.map(({ key, label, emoji }) => {
                const result = integrations[key]
                return (
                  <Card key={key}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{label}</div>
                          <StatusBadge status={result.status} />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => testConnection(key)}
                        disabled={result.status === 'testing'}
                      >
                        Test
                      </Button>
                    </div>
                    {result.message && result.status !== 'idle' && (
                      <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2">{result.message}</p>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab: Automation */}
        {activeTab === 'automation' && (
          <Card>
            <CardHeader><CardTitle>Automation Settings</CardTitle></CardHeader>
            <div className="space-y-5 divide-y divide-gray-100">
              {[
                { key: 'autoGenerateImages' as const, label: 'Auto-generate images when creating a product', desc: 'Automatically generate AI images when a new product is created.' },
                { key: 'autoPostPinterest' as const, label: 'Auto-post to Pinterest after image generation', desc: 'Publish generated images to your Pinterest board automatically.' },
                { key: 'autoSendEmails' as const, label: 'Auto-send email after Stripe purchase', desc: 'Send a confirmation and download email when a customer completes checkout.' },
                { key: 'autoSeoRefresh' as const, label: 'SEO auto-refresh (weekly)', desc: 'Regenerate SEO titles and tags for active listings every week.' },
                { key: 'autoBundleSuggest' as const, label: 'Bundle suggestions (when 3+ products share a niche)', desc: 'Get notified when products can be grouped into a profitable bundle.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-4 pt-4 first:pt-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                  <Toggle value={form[key]} onChange={v => set(key, v)} />
                </div>
              ))}
            </div>
            <div className="pt-6">
              <Button onClick={() => save({ autoGenerateImages: form.autoGenerateImages, autoPostPinterest: form.autoPostPinterest, autoSendEmails: form.autoSendEmails, autoSeoRefresh: form.autoSeoRefresh, autoBundleSuggest: form.autoBundleSuggest })} isLoading={saving}>
                Save Automation Settings
              </Button>
            </div>
          </Card>
        )}
    </div>
  )
}
