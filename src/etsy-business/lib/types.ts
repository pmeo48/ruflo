// Product types
export type ProductType = 'pdf' | 'spreadsheet' | 'notion' | 'prompt-pack' | 'bundle'
export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived'

export interface Product {
  id: string
  name: string
  description: string
  type: ProductType
  status: ProductStatus
  price: number
  compareAtPrice?: number
  etsyListingId?: string
  etsyListingUrl?: string
  tags: string[]
  category: string
  subcategory: string
  contents: string[]
  chapters?: string[]
  thumbnailUrl?: string
  mockupUrls: string[]
  salesCopy?: string
  revenue: number
  sales: number
  views: number
  favorites: number
  conversionRate: number
  avgRating?: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export interface SEOData {
  productId: string
  title: string  // max 140 chars
  tags: string[]  // max 13 tags
  description: string
  keywords: Keyword[]
  category: string
  subcategory: string
  attributes: Record<string, string>
  score: number
}

export interface Keyword {
  term: string
  searchVolume: number
  competition: 'low' | 'medium' | 'high'
  relevanceScore: number
  trend: 'up' | 'down' | 'stable'
}

export interface Bundle {
  id: string
  name: string
  description: string
  productIds: string[]
  price: number
  originalPrice: number
  savings: number
  status: ProductStatus
  revenue: number
  sales: number
  createdAt: string
}

export interface AnalyticsData {
  period: string
  revenue: number
  orders: number
  views: number
  favorites: number
  conversionRate: number
  avgOrderValue: number
}

export interface DashboardStats {
  todayRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  annualRevenue: number
  totalProducts: number
  activeListings: number
  totalSales: number
  avgConversionRate: number
  revenueGrowth: number
  salesGrowth: number
}

export interface ContentPiece {
  type: 'pinterest' | 'blog' | 'email' | 'social'
  platform?: string
  title: string
  content: string
  hashtags?: string[]
  imagePrompt?: string
  scheduledFor?: string
}

export interface Competitor {
  shopName: string
  productTitle: string
  price: number
  sales: number
  rating: number
  tags: string[]
  listingUrl: string
  thumbnailUrl?: string
}

export interface ResearchData {
  keyword: string
  competitors: Competitor[]
  marketSize: number
  avgPrice: number
  topTags: string[]
  opportunity: 'high' | 'medium' | 'low'
  recommendations: string[]
}

export interface AutomationTask {
  id: string
  name: string
  description: string
  trigger: 'manual' | 'scheduled' | 'event'
  schedule?: string
  lastRun?: string
  status: 'idle' | 'running' | 'success' | 'error'
  category: 'seo' | 'content' | 'pricing' | 'research' | 'analytics'
}

export interface GenerateProductRequest {
  type: ProductType
  niche?: string
  targetAudience?: string
  pricePoint?: number
  additionalContext?: string
}

export interface GenerateSEORequest {
  productId: string
  productName: string
  productDescription: string
  productType: ProductType
  targetKeywords?: string[]
}

export interface GenerateContentRequest {
  productId: string
  productName: string
  contentTypes: ('pinterest' | 'blog' | 'email' | 'social')[]
  tone?: string
}

export interface ExpansionVariant {
  id: string
  parentProductId: string
  name: string
  type: 'lite' | 'pro' | 'ultimate' | 'niche' | 'bundle'
  nicheTarget?: string
  priceMultiplier: number
  additionalFeatures: string[]
  estimatedRevenue: number
  status: 'suggested' | 'in-progress' | 'created'
}
