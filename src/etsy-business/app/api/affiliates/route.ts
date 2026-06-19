import { NextResponse } from 'next/server'
import { getAffiliates, createAffiliate } from '@/lib/affiliates'

export async function GET() {
  const affiliates = await getAffiliates()
  const totalEarnings = affiliates.reduce((s, a) => s + a.totalEarnings, 0)
  const totalUnpaid = affiliates.reduce((s, a) => s + a.unpaidEarnings, 0)
  const totalClicks = affiliates.reduce((s, a) => s + a.totalClicks, 0)
  return NextResponse.json({
    affiliates,
    stats: {
      totalEarnings,
      totalUnpaid,
      totalClicks,
      affiliateCount: affiliates.length,
    },
  })
}

export async function POST(req: Request) {
  try {
    const { name, email, commissionRate } = await req.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }
    const affiliate = await createAffiliate(name, email, commissionRate)
    return NextResponse.json({ affiliate })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
