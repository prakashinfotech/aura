-- Migration: Seller Enhancements — Shiprocket columns, extended seller profile, and dashboard RPCs

-- 1. Extend order_items with Shiprocket tracking fields
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS shiprocket_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;

-- 2. Extend sellers table for full 7-step onboarding
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS business_phone   TEXT,
  ADD COLUMN IF NOT EXISTS support_email    TEXT,
  ADD COLUMN IF NOT EXISTS business_type    TEXT DEFAULT 'individual'
    CHECK (business_type IN ('individual','proprietorship','partnership','pvt_ltd','ltd','llp')),
  ADD COLUMN IF NOT EXISTS warehouse_address JSONB,
  ADD COLUMN IF NOT EXISTS bank_details      JSONB,
  ADD COLUMN IF NOT EXISTS documents         JSONB,
  ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step  INTEGER DEFAULT 0;

-- 3. RLS policies for sellers managing their own profile
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own profile"   ON sellers;
DROP POLICY IF EXISTS "Sellers can update own profile" ON sellers;
DROP POLICY IF EXISTS "Sellers can insert own profile" ON sellers;

CREATE POLICY "Sellers can view own profile"
  ON sellers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can insert own profile"
  ON sellers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. RPC: Seller dashboard stats (revenue, orders, products, rating)
CREATE OR REPLACE FUNCTION get_seller_dashboard_stats(p_seller_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue',       COALESCE((
      SELECT SUM(oi.selling_price * oi.qty)
      FROM   order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE  oi.seller_id = p_seller_id
        AND  oi.status NOT IN ('cancelled','returned')
        AND  o.payment_status = 'paid'
    ), 0),
    'total_orders',        COALESCE((
      SELECT COUNT(*) FROM order_items WHERE seller_id = p_seller_id
    ), 0),
    'active_products',     COALESCE((
      SELECT COUNT(*) FROM products
      WHERE  seller_id = p_seller_id AND status = 'active' AND deleted_at IS NULL
    ), 0),
    'avg_rating',          COALESCE((
      SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
      FROM   reviews r JOIN products p ON p.id = r.product_id
      WHERE  p.seller_id = p_seller_id
    ), 0),
    'pending_count',       COALESCE((
      SELECT COUNT(*) FROM order_items
      WHERE  seller_id = p_seller_id AND status = 'placed'
    ), 0),
    'curr_month_revenue',  COALESCE((
      SELECT SUM(oi.selling_price * oi.qty)
      FROM   order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE  oi.seller_id = p_seller_id
        AND  oi.status NOT IN ('cancelled','returned')
        AND  o.payment_status = 'paid'
        AND  o.created_at >= date_trunc('month', NOW())
    ), 0),
    'prev_month_revenue',  COALESCE((
      SELECT SUM(oi.selling_price * oi.qty)
      FROM   order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE  oi.seller_id = p_seller_id
        AND  oi.status NOT IN ('cancelled','returned')
        AND  o.payment_status = 'paid'
        AND  o.created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND  o.created_at <  date_trunc('month', NOW())
    ), 0),
    'curr_month_orders',   COALESCE((
      SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE  oi.seller_id = p_seller_id
        AND  o.created_at >= date_trunc('month', NOW())
    ), 0),
    'prev_month_orders',   COALESCE((
      SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE  oi.seller_id = p_seller_id
        AND  o.created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND  o.created_at <  date_trunc('month', NOW())
    ), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- 5. RPC: Monthly revenue for analytics chart (last N months)
CREATE OR REPLACE FUNCTION get_seller_monthly_revenue(
  p_seller_id UUID,
  p_months    INTEGER DEFAULT 6
)
RETURNS TABLE(month_label TEXT, revenue NUMERIC, order_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(gs.m, 'Mon')                        AS month_label,
    COALESCE(SUM(oi.selling_price * oi.qty), 0) AS revenue,
    COUNT(DISTINCT oi.id)                        AS order_count
  FROM generate_series(
    date_trunc('month', NOW()) - ((p_months - 1) || ' months')::INTERVAL,
    date_trunc('month', NOW()),
    '1 month'::INTERVAL
  ) AS gs(m)
  LEFT JOIN orders o
    ON  date_trunc('month', o.created_at) = gs.m
  LEFT JOIN order_items oi
    ON  oi.order_id  = o.id
    AND oi.seller_id = p_seller_id
    AND oi.status NOT IN ('cancelled','returned')
  GROUP BY gs.m
  ORDER BY gs.m;
END;
$$;

-- 6. RPC: Seller orders with full product + buyer detail
CREATE OR REPLACE FUNCTION get_seller_orders(
  p_seller_id UUID,
  p_status    TEXT    DEFAULT NULL,
  p_search    TEXT    DEFAULT NULL,
  p_limit     INTEGER DEFAULT 50,
  p_offset    INTEGER DEFAULT 0
)
RETURNS TABLE(
  item_id              UUID,
  order_id             UUID,
  order_number         TEXT,
  product_title        TEXT,
  product_image        TEXT,
  variant_size         TEXT,
  variant_color        TEXT,
  qty                  INTEGER,
  selling_price        NUMERIC,
  item_status          TEXT,
  tracking_number      TEXT,
  courier              TEXT,
  shiprocket_order_id  TEXT,
  shiprocket_ship_id   TEXT,
  dispatched_at        TIMESTAMPTZ,
  order_created_at     TIMESTAMPTZ,
  sla_hours            INTEGER,
  delivery_address     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.id                                           AS item_id,
    o.id                                            AS order_id,
    UPPER(LEFT(o.id::TEXT, 8))                      AS order_number,
    p.title                                         AS product_title,
    pi.url                                          AS product_image,
    pv.size                                         AS variant_size,
    pv.color                                        AS variant_color,
    oi.qty,
    oi.selling_price,
    oi.status                                       AS item_status,
    oi.tracking_number,
    oi.courier,
    oi.shiprocket_order_id,
    oi.shiprocket_shipment_id                       AS shiprocket_ship_id,
    oi.dispatched_at,
    o.created_at                                    AS order_created_at,
    CASE
      WHEN oi.status = 'placed' THEN
        GREATEST(0,
          EXTRACT(EPOCH FROM (o.created_at + INTERVAL '48 hours' - NOW()))::INTEGER / 3600
        )
      ELSE NULL
    END                                             AS sla_hours,
    jsonb_build_object(
      'name',    a.name,
      'line1',   a.line1,
      'line2',   a.line2,
      'city',    a.city,
      'state',   a.state,
      'pincode', a.pincode,
      'phone',   a.phone,
      'email',   pr.email
    )                                               AS delivery_address
  FROM order_items oi
  JOIN orders          o  ON o.id  = oi.order_id
  JOIN product_variants pv ON pv.id = oi.variant_id
  JOIN products         p  ON p.id  = oi.product_id
  JOIN profiles         pr ON pr.id = o.user_id
  JOIN addresses        a  ON a.id  = o.address_id
  LEFT JOIN product_images pi
    ON  pi.product_id = oi.product_id AND pi.is_primary = TRUE
  WHERE oi.seller_id = p_seller_id
    AND (p_status IS NULL OR oi.status = p_status)
    AND (
      p_search IS NULL
      OR p.title ILIKE '%' || p_search || '%'
      OR UPPER(LEFT(o.id::TEXT, 8)) ILIKE '%' || p_search || '%'
    )
  ORDER BY o.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- 7. RPC: Top products for analytics
CREATE OR REPLACE FUNCTION get_seller_top_products(
  p_seller_id UUID,
  p_limit     INTEGER DEFAULT 10
)
RETURNS TABLE(
  product_id    UUID,
  product_title TEXT,
  units_sold    BIGINT,
  revenue       NUMERIC,
  avg_rating    NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                              AS product_id,
    p.title                           AS product_title,
    COALESCE(SUM(oi.qty), 0)          AS units_sold,
    COALESCE(SUM(oi.selling_price * oi.qty), 0) AS revenue,
    COALESCE(p.rating_avg, 0)         AS avg_rating
  FROM products p
  LEFT JOIN order_items oi
    ON  oi.product_id = p.id
    AND oi.status NOT IN ('cancelled','returned')
  WHERE p.seller_id = p_seller_id
    AND p.deleted_at IS NULL
  GROUP BY p.id, p.title, p.rating_avg
  ORDER BY units_sold DESC, revenue DESC
  LIMIT p_limit;
END;
$$;
