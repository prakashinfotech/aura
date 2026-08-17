-- Migration 005: Financials, Loyalty, Platform

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat','percent','free_delivery','category','brand','first_order','bank')),
  value NUMERIC(10,2) NOT NULL,
  max_discount NUMERIC(10,2),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  applicable_category_id UUID REFERENCES categories(id),
  applicable_brand_id UUID REFERENCES brands(id),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  order_item_id UUID REFERENCES order_items(id) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  helpful_yes INTEGER DEFAULT 0,
  helpful_no INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_item_id)
);

CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  blur_data_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_votes (
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  helpful BOOLEAN NOT NULL,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS insider_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem','expire','bonus')),
  reference_id UUID,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url_desktop TEXT NOT NULL,
  image_url_mobile TEXT NOT NULL,
  target_url TEXT,
  position TEXT DEFAULT 'hero' CHECK (position IN ('hero','category','sidebar','deals')),
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals_of_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  deal_price NUMERIC(10,2) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission NUMERIC(10,2) NOT NULL,
  tds NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  razorpay_payout_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product rating trigger (now that reviews table exists)
DROP TRIGGER IF EXISTS trg_reviews_update_product_rating ON reviews;
CREATE TRIGGER trg_reviews_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews public read" ON reviews;
CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Reviews buyer write own" ON reviews;
CREATE POLICY "Reviews buyer write own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reviews buyer update within 7 days" ON reviews;
CREATE POLICY "Reviews buyer update within 7 days" ON reviews FOR UPDATE
  USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '7 days');

DROP POLICY IF EXISTS "Notifications own" ON notifications;
CREATE POLICY "Notifications own" ON notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coupons public read active" ON coupons;
CREATE POLICY "Coupons public read active" ON coupons FOR SELECT
  USING (active = TRUE AND valid_until > NOW());

DROP POLICY IF EXISTS "Banners public read active" ON banners;
CREATE POLICY "Banners public read active" ON banners FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Settlements seller own" ON settlements;
CREATE POLICY "Settlements seller own" ON settlements FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
