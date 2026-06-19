import { supabase } from './supabase'

export interface AppSettings {
  // Store info
  storeName: string
  storeTagline: string
  storeUrl: string
  storeEmail: string
  // API Keys (masked for display)
  openaiKey: string
  anthropicKey: string
  stripePublishableKey: string
  resendApiKey: string
  pinterestAccessToken: string
  pinterestBoardId: string
  etsyApiKey: string
  etsyShopId: string
  supabaseUrl: string
  supabaseAnonKey: string
  // Business settings
  defaultProductPrice: string
  defaultCurrency: string
  autoGenerateImages: string
  autoPostPinterest: string
  autoSendEmails: string
  taxRate: string
}

const DEFAULTS: AppSettings = {
  storeName: 'AI Digital Products',
  storeTagline: 'Premium AI tools for modern professionals',
  storeUrl: '',
  storeEmail: '',
  openaiKey: '',
  anthropicKey: '',
  stripePublishableKey: '',
  resendApiKey: '',
  pinterestAccessToken: '',
  pinterestBoardId: '',
  etsyApiKey: '',
  etsyShopId: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  defaultProductPrice: '27',
  defaultCurrency: 'USD',
  autoGenerateImages: 'false',
  autoPostPinterest: 'false',
  autoSendEmails: 'true',
  taxRate: '0',
}

export async function getSettings(): Promise<AppSettings> {
  if (!supabase) return DEFAULTS
  try {
    const { data } = await supabase.from('settings').select('key, value')
    if (!data?.length) return DEFAULTS
    const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
    return { ...DEFAULTS, ...map } as AppSettings
  } catch {
    return DEFAULTS
  }
}

export async function saveSetting(key: string, value: string): Promise<boolean> {
  if (!supabase) return false
  try {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    return true
  } catch {
    return false
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
  if (!supabase) return false
  try {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? '' }))
    await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    return true
  } catch {
    return false
  }
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : ''
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}
