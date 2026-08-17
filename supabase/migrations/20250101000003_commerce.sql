-- Migration 004: Commerce Tables

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  address_id UUID REFERENCES addresses(id) NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed','processing','shipped','out_for_delivery','delivered','cancelled','return_initiated','returned')),
  subtotal NUMERIC(10,2) NOT NULL,
  total_discount NUMERIC(10,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  credits_used NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('upi','card','netbanking','emi','wallet','cod')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id) NOT NULL,
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  mrp NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed','processing','shipped','out_for_delivery','delivered','cancelled','return_initiated','returned')),
  tracking_number TEXT,
  courier TEXT,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  sub_reason TEXT,
  pickup_address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated','approved','pickup_scheduled','picked_up','received','refund_initiated','completed','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cart own rows" ON cart_items;
CREATE POLICY "Cart own rows" ON cart_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Wishlist own rows" ON wishlists;
CREATE POLICY "Wishlist own rows" ON wishlists FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Orders buyer own" ON orders;
CREATE POLICY "Orders buyer own" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Orders insert own" ON orders;
CREATE POLICY "Orders insert own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Orders seller see own items" ON order_items;
CREATE POLICY "Orders seller see own items" ON order_items FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Returns own" ON returns;
CREATE POLICY "Returns own" ON returns FOR ALL USING (auth.uid() = user_id);
