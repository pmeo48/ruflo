import { supabase } from './supabase'

export function generateAffiliateCode(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}${suffix}`
}

export interface AffiliateStats {
  id: string
  name: string
  email: string
  code: string
  commissionRate: number
  status: string
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  unpaidEarnings: number
  paidEarnings: number
  conversionRate: number
  paypalEmail?: string
  createdAt: string
}

export async function getAffiliates(): Promise<AffiliateStats[]> {
  if (!supabase) return MOCK_AFFILIATES
  const { data } = await supabase.from('affiliates').select('*').order('total_earnings', { ascending: false })
  return (data ?? []).map(mapAffiliate)
}

export async function getAffiliate(code: string): Promise<AffiliateStats | null> {
  if (!supabase) return MOCK_AFFILIATES.find(a => a.code === code) ?? null
  const { data } = await supabase.from('affiliates').select('*').eq('code', code).single()
  return data ? mapAffiliate(data) : null
}

export async function createAffiliate(name: string, email: string, commissionRate = 30): Promise<AffiliateStats | null> {
  const code = generateAffiliateCode(name)
  if (!supabase) {
    const mock: AffiliateStats = {
      id: `mock-${Date.now()}`,
      name,
      email,
      code,
      commissionRate,
      status: 'active',
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
      unpaidEarnings: 0,
      paidEarnings: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
    }
    return mock
  }
  const { data } = await supabase
    .from('affiliates')
    .insert({ name, email, code, commission_rate: commissionRate })
    .select()
    .single()
  return data ? mapAffiliate(data) : null
}

export async function trackClick(affiliateCode: string, productId?: string): Promise<void> {
  if (!supabase) return
  const affiliate = await getAffiliate(affiliateCode)
  if (!affiliate) return
  await Promise.all([
    supabase.from('affiliate_clicks').insert({
      affiliate_id: affiliate.id,
      product_id: productId ?? null,
    }),
    supabase
      .from('affiliates')
      .update({ total_clicks: affiliate.totalClicks + 1 })
      .eq('id', affiliate.id),
  ])
}

export async function recordCommission(
  affiliateCode: string,
  orderId: string,
  saleAmount: number
): Promise<void> {
  if (!supabase) return
  const affiliate = await getAffiliate(affiliateCode)
  if (!affiliate || affiliate.status !== 'active') return
  const commission = (saleAmount * affiliate.commissionRate) / 100
  await Promise.all([
    supabase.from('affiliate_commissions').insert({
      affiliate_id: affiliate.id,
      order_id: orderId,
      amount: saleAmount,
      commission,
    }),
    supabase
      .from('affiliates')
      .update({
        total_conversions: affiliate.totalConversions + 1,
        total_earnings: affiliate.totalEarnings + commission,
        unpaid_earnings: affiliate.unpaidEarnings + commission,
      })
      .eq('id', affiliate.id),
  ])
}

function mapAffiliate(d: Record<string, unknown>): AffiliateStats {
  const clicks = Number(d.total_clicks) || 0
  const conversions = Number(d.total_conversions) || 0
  return {
    id: String(d.id),
    name: String(d.name),
    email: String(d.email),
    code: String(d.code),
    commissionRate: Number(d.commission_rate),
    status: String(d.status),
    totalClicks: clicks,
    totalConversions: conversions,
    totalEarnings: Number(d.total_earnings),
    unpaidEarnings: Number(d.unpaid_earnings),
    paidEarnings: Number(d.paid_earnings),
    conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 100) : 0,
    paypalEmail: d.paypal_email ? String(d.paypal_email) : undefined,
    createdAt: String(d.created_at),
  }
}

const MOCK_AFFILIATES: AffiliateStats[] = [
  {
    id: 'aff-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    code: 'sarah2024',
    commissionRate: 30,
    status: 'active',
    totalClicks: 1240,
    totalConversions: 47,
    totalEarnings: 1892.50,
    unpaidEarnings: 892.50,
    paidEarnings: 1000,
    conversionRate: 4,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'aff-2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    code: 'mikec4x9',
    commissionRate: 25,
    status: 'active',
    totalClicks: 890,
    totalConversions: 31,
    totalEarnings: 1204.75,
    unpaidEarnings: 604.75,
    paidEarnings: 600,
    conversionRate: 3,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'aff-3',
    name: 'Emma Davis',
    email: 'emma@example.com',
    code: 'emmadav7',
    commissionRate: 30,
    status: 'active',
    totalClicks: 567,
    totalConversions: 22,
    totalEarnings: 876.20,
    unpaidEarnings: 876.20,
    paidEarnings: 0,
    conversionRate: 4,
    createdAt: '2024-03-10T00:00:00Z',
  },
]
