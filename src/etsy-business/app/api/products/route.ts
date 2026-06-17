import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { Product } from '@/lib/types'

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const products: Product[] = (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        type: row.type,
        status: row.status,
        price: Number(row.price),
        compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
        etsyListingId: row.etsy_listing_id ?? undefined,
        etsyListingUrl: row.etsy_listing_url ?? undefined,
        tags: row.tags ?? [],
        category: row.category ?? '',
        subcategory: row.subcategory ?? '',
        contents: row.contents ?? [],
        chapters: row.chapters ?? undefined,
        thumbnailUrl: row.thumbnail_url ?? undefined,
        mockupUrls: row.mockup_urls ?? [],
        salesCopy: row.sales_copy ?? undefined,
        revenue: Number(row.revenue ?? 0),
        sales: row.sales ?? 0,
        views: row.views ?? 0,
        favorites: row.favorites ?? 0,
        conversionRate: Number(row.conversion_rate ?? 0),
        avgRating: row.avg_rating ? Number(row.avg_rating) : undefined,
        reviewCount: row.review_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return NextResponse.json(products)
    } catch (err) {
      console.error('Supabase error fetching products, falling back to mock:', err)
    }
  }

  return NextResponse.json(MOCK_PRODUCTS)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (supabase) {
      const insertRow = {
        name: body.name,
        description: body.description ?? '',
        type: body.type,
        status: body.status ?? 'draft',
        price: body.price ?? 27,
        compare_at_price: body.compareAtPrice ?? null,
        etsy_listing_id: body.etsyListingId ?? null,
        etsy_listing_url: body.etsyListingUrl ?? null,
        tags: body.tags ?? [],
        category: body.category ?? '',
        subcategory: body.subcategory ?? '',
        contents: body.contents ?? [],
        chapters: body.chapters ?? null,
        thumbnail_url: body.thumbnailUrl ?? null,
        mockup_urls: body.mockupUrls ?? [],
        sales_copy: body.salesCopy ?? null,
        revenue: 0,
        sales: 0,
        views: 0,
        favorites: 0,
        conversion_rate: 0,
        review_count: 0,
      }

      const { data, error } = await supabase
        .from('products')
        .insert([insertRow])
        .select()
        .single()

      if (error) throw error

      const product: Product = {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        type: data.type,
        status: data.status,
        price: Number(data.price),
        compareAtPrice: data.compare_at_price ? Number(data.compare_at_price) : undefined,
        etsyListingId: data.etsy_listing_id ?? undefined,
        etsyListingUrl: data.etsy_listing_url ?? undefined,
        tags: data.tags ?? [],
        category: data.category ?? '',
        subcategory: data.subcategory ?? '',
        contents: data.contents ?? [],
        chapters: data.chapters ?? undefined,
        thumbnailUrl: data.thumbnail_url ?? undefined,
        mockupUrls: data.mockup_urls ?? [],
        salesCopy: data.sales_copy ?? undefined,
        revenue: 0,
        sales: 0,
        views: 0,
        favorites: 0,
        conversionRate: 0,
        reviewCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return NextResponse.json(product, { status: 201 })
    }

    // Mock fallback
    const newProduct: Product = {
      id: String(Date.now()),
      ...body,
      revenue: 0,
      sales: 0,
      views: 0,
      favorites: 0,
      conversionRate: 0,
      reviewCount: 0,
      mockupUrls: body.mockupUrls ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(newProduct, { status: 201 })
  } catch (err) {
    console.error('Error creating product:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
