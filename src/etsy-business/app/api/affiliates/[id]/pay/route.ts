import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!supabase) {
    return NextResponse.json({
      success: true,
      demo: true,
      message: 'Demo mode — Supabase not configured',
    })
  }
  try {
    await Promise.all([
      supabase
        .from('affiliate_commissions')
        .update({ status: 'paid' })
        .eq('affiliate_id', params.id)
        .eq('status', 'pending'),
      supabase
        .from('affiliates')
        .update({ paid_earnings: supabase.rpc('paid_earnings + unpaid_earnings'), unpaid_earnings: 0 })
        .eq('id', params.id),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
