-- Migration 003: Catalog

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  store_name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended','rejected')),
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 20,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  description TEXT,
  gender TEXT CHECK (gender IN ('men','women','boys','girls','unisex')),
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_review','active','rejected','archived')),
  search_vector TSVECTOR,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  sku TEXT UNIQUE NOT NULL,
  stock_qty INTEGER DEFAULT 0,
  mrp NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  url TEXT NOT NULL,
  blur_data_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) UNIQUE,
  guide_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- Search vector trigger
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Rating update function (referenced in migration 005)
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_sellers_updated_at ON sellers;
CREATE TRIGGER trg_sellers_updated_at
  BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_variants_updated_at ON product_variants;
CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories public read" ON categories;
CREATE POLICY "Categories public read" ON categories FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Brands public read" ON brands;
CREATE POLICY "Brands public read" ON brands FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Products public read" ON products;
CREATE POLICY "Products public read" ON products FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Variants public read" ON product_variants;
CREATE POLICY "Variants public read" ON product_variants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Images public read" ON product_images;
CREATE POLICY "Images public read" ON product_images FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Sellers read own" ON sellers;
CREATE POLICY "Sellers read own" ON sellers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Products seller manage own" ON products;
CREATE POLICY "Products seller manage own" ON products FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
