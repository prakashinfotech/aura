-- Migration: Enhanced Catalog Tables
-- Adds: product_attributes, product_tags, product_videos, product_relations,
--       inventory_logs, seller_analytics, recently_viewed_products, product_questions

CREATE TABLE IF NOT EXISTS product_attributes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  attribute_name   TEXT NOT NULL,
  attribute_value  TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tag        TEXT NOT NULL,
  UNIQUE(product_id, tag)
);

CREATE TABLE IF NOT EXISTS product_videos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  title         TEXT,
  sort_order    INTEGER DEFAULT 0
);

-- Supports: similar, related, frequently_bought_together, complete_the_look, recommended
CREATE TABLE IF NOT EXISTS product_relations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  related_product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  relation_type      TEXT NOT NULL CHECK (relation_type IN (
    'similar','related','frequently_bought_together','complete_the_look','recommended'
  )),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(product_id, related_product_id, relation_type)
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  change_qty INTEGER NOT NULL,
  reason     TEXT NOT NULL CHECK (reason IN ('sale','return','restock','adjustment','damage')),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  orders      INTEGER DEFAULT 0,
  revenue     NUMERIC(12,2) DEFAULT 0,
  returns     INTEGER DEFAULT 0,
  UNIQUE(seller_id, date)
);

CREATE TABLE IF NOT EXISTS recently_viewed_products (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id),
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_attrs_product  ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product   ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag       ON product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_relations_src  ON product_relations(product_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_product_relations_dst  ON product_relations(related_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant ON inventory_logs(variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_analytics_date  ON seller_analytics(seller_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user   ON recently_viewed_products(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_questions_prod ON product_questions(product_id, created_at DESC);

-- RLS
ALTER TABLE product_attributes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_questions      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attrs public read"     ON product_attributes;
DROP POLICY IF EXISTS "Tags public read"      ON product_tags;
DROP POLICY IF EXISTS "Videos public read"    ON product_videos;
DROP POLICY IF EXISTS "Relations public read" ON product_relations;
DROP POLICY IF EXISTS "Questions public read" ON product_questions;
DROP POLICY IF EXISTS "Questions auth write"  ON product_questions;
DROP POLICY IF EXISTS "Inv logs seller own"   ON inventory_logs;
DROP POLICY IF EXISTS "Analytics seller own"  ON seller_analytics;
DROP POLICY IF EXISTS "Recently viewed own"   ON recently_viewed_products;

CREATE POLICY "Attrs public read"     ON product_attributes     FOR SELECT USING (TRUE);
CREATE POLICY "Tags public read"      ON product_tags           FOR SELECT USING (TRUE);
CREATE POLICY "Videos public read"    ON product_videos         FOR SELECT USING (TRUE);
CREATE POLICY "Relations public read" ON product_relations      FOR SELECT USING (TRUE);
CREATE POLICY "Questions public read" ON product_questions      FOR SELECT USING (TRUE);
CREATE POLICY "Questions auth write"  ON product_questions      FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Inv logs seller own"   ON inventory_logs         FOR SELECT
  USING (variant_id IN (
    SELECT pv.id FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN sellers  s ON s.id = p.seller_id
    WHERE s.user_id = auth.uid()
  ));
CREATE POLICY "Analytics seller own"  ON seller_analytics       FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "Recently viewed own"   ON recently_viewed_products FOR ALL
  USING (auth.uid() = user_id);
