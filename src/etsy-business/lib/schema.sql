-- Etsy AI Business Platform - Supabase Schema

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'spreadsheet', 'notion', 'prompt-pack', 'bundle')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  etsy_listing_id TEXT,
  etsy_listing_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  subcategory TEXT,
  contents TEXT[] DEFAULT '{}',
  chapters TEXT[],
  thumbnail_url TEXT,
  mockup_urls TEXT[] DEFAULT '{}',
  sales_copy TEXT,
  revenue DECIMAL(12,2) DEFAULT 0,
  sales INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  avg_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO data table
CREATE TABLE seo_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  primary_keyword TEXT,
  score INTEGER DEFAULT 0,
  keywords JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundles table
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] DEFAULT '{}',
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  revenue DECIMAL(12,2) DEFAULT 0,
  sales INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  period DATE NOT NULL,
  revenue DECIMAL(12,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  niche TEXT,
  search_volume INTEGER DEFAULT 0,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  relevance_score INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content pieces table
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  type TEXT CHECK (type IN ('pinterest', 'blog', 'email', 'social')),
  platform TEXT,
  title TEXT,
  content TEXT,
  hashtags TEXT[],
  image_prompt TEXT,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation tasks table
CREATE TABLE automation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT CHECK (trigger IN ('manual', 'scheduled', 'event')),
  schedule TEXT,
  last_run TIMESTAMPTZ,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'success', 'error')),
  category TEXT CHECK (category IN ('seo', 'content', 'pricing', 'research', 'analytics')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundle products junction table
CREATE TABLE IF NOT EXISTS bundle_products (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, product_id)
);

-- Orders table (for analytics)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  bundle_id UUID REFERENCES bundles(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  etsy_order_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row level security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Stored procedure for atomic sales increment
CREATE OR REPLACE FUNCTION increment_product_sales(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products SET sales = sales + 1, revenue = revenue + (SELECT price FROM products WHERE id = p_id) WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Settings table for runtime configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON settings FOR ALL USING (true);
