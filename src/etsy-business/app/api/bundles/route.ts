import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_BUNDLES, MOCK_PRODUCTS } from '@/lib/mock-data'
import { Bundle } from '@/lib/types'

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const bundles: Bundle[] = (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        productIds: row.product_ids ?? [],
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : 0,
        savings: row.original_price ? Number(row.original_price) - Number(row.price) : 0,
        status: row.status ?? 'active',
        revenue: Number(row.revenue ?? 0),
        sales: row.sales ?? 0,
        createdAt: row.created_at,
      }))

      return NextResponse.json(bundles)
    } catch (err) {
      console.error('Supabase error fetching bundles, falling back to mock:', err)
    }
  }

  return NextResponse.json(MOCK_BUNDLES)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productIds } = body as { productIds: string[] }

    const products = MOCK_PRODUCTS.filter((p) => productIds.includes(p.id))
    const originalPrice = products.reduce((s, p) => s + p.price, 0)
    const suggestedPrice = Math.round(originalPrice * 0.6)
    const firstWords = products.map((p) => p.name.split(' ')[0]).slice(0, 3).join(' + ')
    const savingsPct = Math.round((1 - suggestedPrice / originalPrice) * 100)

    const bundleName = `${firstWords} Power Bundle`
    const bundleDescription = `Save ${savingsPct}% with this curated bundle of ${products.length} top-rated AI products. Everything you need to accelerate your business growth.`

    if (supabase) {
      const { data, error } = await supabase
        .from('bundles')
        .insert([{
          name: bundleName,
          description: bundleDescription,
          product_ids: productIds,
          price: suggestedPrice,
          original_price: originalPrice,
          status: 'draft',
          revenue: 0,
          sales: 0,
        }])
        .select()
        .single()

      if (error) throw error

      const bundle: Bundle = {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        productIds: data.product_ids ?? [],
        price: Number(data.price),
        originalPrice: Number(data.original_price ?? 0),
        savings: Number(data.original_price ?? 0) - Number(data.price),
        status: data.status,
        revenue: Number(data.revenue ?? 0),
        sales: data.sales ?? 0,
        createdAt: data.created_at,
      }

      return NextResponse.json(bundle, { status: 201 })
    }

    // Mock fallback
    const bundle: Bundle = {
      id: `b${Date.now()}`,
      name: bundleName,
      description: bundleDescription,
      productIds,
      price: suggestedPrice,
      originalPrice,
      savings: originalPrice - suggestedPrice,
      status: 'draft',
      revenue: 0,
      sales: 0,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(bundle, { status: 201 })
  } catch (err) {
    console.error('Error creating bundle:', err)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
