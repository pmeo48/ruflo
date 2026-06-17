const ETSY_BASE_URL = 'https://openapi.etsy.com/v3'

const apiKey = process.env.ETSY_API_KEY
const shopId = process.env.ETSY_SHOP_ID
const accessToken = process.env.ETSY_ACCESS_TOKEN

export const isEtsyConfigured = () => !!(apiKey && shopId && accessToken)

async function etsyRequest(path: string, options: RequestInit = {}) {
  if (!isEtsyConfigured()) throw new Error('Etsy API not configured')
  const res = await fetch(`${ETSY_BASE_URL}${path}`, {
    ...options,
    headers: {
      'x-api-key': apiKey!,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Etsy API error ${res.status}: ${error}`)
  }
  return res.json()
}

export interface EtsyListingDraft {
  title: string
  description: string
  price: number
  quantity: number
  tags: string[]
  materials: string[]
  shipping_profile_id?: number
  taxonomy_id?: number
  type: 'download'
  is_digital: true
  file_data?: string
}

export async function createEtsyListing(draft: EtsyListingDraft) {
  return etsyRequest(`/application/shops/${shopId}/listings`, {
    method: 'POST',
    body: JSON.stringify({
      ...draft,
      who_made: 'i_did',
      when_made: 'made_to_order',
      is_supply: false,
      state: 'draft',
    }),
  })
}

export async function updateEtsyListing(listingId: string, data: Partial<EtsyListingDraft>) {
  return etsyRequest(`/application/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getEtsyShopListings() {
  return etsyRequest(`/application/shops/${shopId}/listings?limit=100&state=active`)
}

export async function getEtsyListing(listingId: string) {
  return etsyRequest(`/application/listings/${listingId}`)
}

export async function publishEtsyListing(listingId: string) {
  return etsyRequest(`/application/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'active' }),
  })
}

export async function deleteEtsyListing(listingId: string) {
  return etsyRequest(`/application/listings/${listingId}`, { method: 'DELETE' })
}
