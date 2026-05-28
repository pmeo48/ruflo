export interface Niche {
  id: string;
  name: string;
  opportunityScore: number;
  searchVolume: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
  avgPrice: number;
  tags: string[];
}

export interface MarketReport {
  niches: Niche[];
  topKeywords: string[];
  generatedAt: Date;
}

export type ProductType =
  | 'printable'
  | 'svg'
  | 'template'
  | 'planner'
  | 'wall-art'
  | 'digital-paper'
  | 'font'
  | 'mockup';

export type ProductStatus =
  | 'idea'
  | 'in-progress'
  | 'ready'
  | 'listed'
  | 'archived';

export interface ProductVariant {
  name: string;
  fileFormat: string;
  dimensions?: string;
}

export interface Product {
  id: string;
  title: string;
  type: ProductType;
  niche: string;
  targetAudience: string;
  useCase: string;
  variants: ProductVariant[];
  status: ProductStatus;
  createdAt: Date;
}

export interface EtsyListing {
  productId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  primaryImageAlt: string;
  sectionPlacement: string;
}

export interface PriceRecommendation {
  productId: string;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  competitorRange: { low: number; high: number };
  marginPercent: number;
  promotionStrategy: string;
}

export type MetricKey =
  | 'views'
  | 'clicks'
  | 'conversions'
  | 'revenue'
  | 'reviews';

export interface ListingMetrics {
  listingId: string;
  productId: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  reviewCount: number;
  avgRating: number;
  period: string;
}

export interface GrowthReport {
  period: string;
  topPerformers: string[];
  underperformers: string[];
  totalRevenue: number;
  totalOrders: number;
  recommendations: string[];
  generatedAt: Date;
}

export type AgentMessageType =
  | 'market-report'
  | 'product-created'
  | 'listing-ready'
  | 'pricing-ready'
  | 'analytics-report'
  | 'request'
  | 'error';

export interface AgentMessage {
  from: string;
  to: string;
  type: AgentMessageType;
  payload: unknown;
  timestamp: Date;
}

export interface EtsyBusinessState {
  sessionId: string;
  products: Product[];
  listings: EtsyListing[];
  prices: PriceRecommendation[];
  metrics: ListingMetrics[];
  lastMarketReport?: MarketReport;
  lastGrowthReport?: GrowthReport;
  updatedAt: Date;
}
