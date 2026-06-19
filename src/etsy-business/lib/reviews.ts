import { Review } from './types'
import { supabase } from './supabase'
import { MOCK_PRODUCTS } from './mock-data'

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    productId: MOCK_PRODUCTS[0].id,
    productName: MOCK_PRODUCTS[0].name,
    customerName: 'Sarah M.',
    rating: 5,
    title: 'Completely transformed my agency!',
    body: 'This toolkit paid for itself in the first week. My clients love the AI-powered reports and the templates saved me 20+ hours of setup time.',
    verified: true,
    status: 'published',
    reply: "Thank you Sarah! So glad it's working well for your agency.",
    createdAt: '2024-11-15T10:30:00Z',
  },
  {
    id: '2',
    productId: MOCK_PRODUCTS[1].id,
    productName: MOCK_PRODUCTS[1].name,
    customerName: 'James K.',
    rating: 5,
    title: 'Best purchase I made this year',
    body: 'I launched my AI agency in 3 weeks using this kit. The client onboarding templates alone are worth triple the price.',
    verified: true,
    status: 'published',
    createdAt: '2024-11-20T14:00:00Z',
  },
  {
    id: '3',
    productId: MOCK_PRODUCTS[2].id,
    productName: MOCK_PRODUCTS[2].name,
    customerName: 'Linda T.',
    rating: 4,
    title: 'Great value, minor learning curve',
    body: 'Really comprehensive bundle. Took a few hours to set everything up but now my business basically runs itself. Would love a video walkthrough.',
    verified: true,
    status: 'published',
    createdAt: '2024-12-01T09:15:00Z',
  },
  {
    id: '4',
    productId: MOCK_PRODUCTS[3].id,
    productName: MOCK_PRODUCTS[3].name,
    customerName: 'Mike R.',
    rating: 5,
    title: 'Incredible content output',
    body: "The prompt templates are fire. I'm generating a week's worth of content in under an hour now.",
    verified: false,
    status: 'pending',
    createdAt: '2024-12-10T16:45:00Z',
  },
]

export async function getReviews(filter?: { productId?: string; status?: Review['status'] }): Promise<Review[]> {
  if (!supabase) {
    let reviews = MOCK_REVIEWS
    if (filter?.productId) reviews = reviews.filter((r) => r.productId === filter.productId)
    if (filter?.status) reviews = reviews.filter((r) => r.status === filter.status)
    return reviews
  }

  let query = supabase.from('reviews').select('*').order('created_at', { ascending: false })
  if (filter?.productId) query = query.eq('product_id', filter.productId)
  if (filter?.status) query = query.eq('status', filter.status)

  const { data, error } = await query
  if (error || !data) return MOCK_REVIEWS

  return data.map((r) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified,
    status: r.status as Review['status'],
    reply: r.reply,
    createdAt: r.created_at,
  }))
}

export async function createReview(params: Omit<Review, 'id' | 'status' | 'verified' | 'createdAt'>): Promise<Review> {
  const review: Review = {
    id: crypto.randomUUID(),
    ...params,
    verified: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  if (!supabase) return review

  await supabase.from('reviews').insert({
    id: review.id,
    product_id: review.productId,
    product_name: review.productName,
    customer_name: review.customerName,
    customer_email: review.customerEmail,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verified: false,
    status: 'pending',
    created_at: review.createdAt,
  })

  return review
}

export async function updateReviewStatus(id: string, status: Review['status']): Promise<void> {
  if (!supabase) return
  await supabase.from('reviews').update({ status }).eq('id', id)
}

export async function replyToReview(id: string, reply: string): Promise<void> {
  if (!supabase) return
  await supabase.from('reviews').update({ reply }).eq('id', id)
}

export function getAverageRating(reviews: Review[]): number {
  const published = reviews.filter((r) => r.status === 'published')
  if (!published.length) return 0
  return published.reduce((sum, r) => sum + r.rating, 0) / published.length
}
