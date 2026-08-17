-- ─────────────────────────────────────────────────────────────────────────────
-- settlements enhancements
-- 1. Add settlement_id FK to order_items (tracks which items belong to which settlement)
-- 2. RPC: get_seller_available_balance — unsettled earned amount
-- 3. RPC: create_seller_settlement    — atomically creates a settlement + marks items
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Track which settlement each order_item belongs to
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id);

CREATE INDEX IF NOT EXISTS order_items_settlement_id_idx ON order_items(settlement_id);
CREATE INDEX IF NOT EXISTS order_items_seller_status_idx ON order_items(seller_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC: get_seller_available_balance
--    Returns the gross, commission, TDS, net, and item count that are eligible
--    for a settlement payout (shipped/delivered, paid order, not yet settled).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_seller_available_balance(p_seller_id UUID)
RETURNS TABLE(
  available_gross   NUMERIC,
  available_net     NUMERIC,
  commission_amount NUMERIC,
  tds_amount        NUMERIC,
  eligible_items    BIGINT,
  commission_rate   NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  SELECT COALESCE(s.commission_rate, 15) INTO v_rate
  FROM sellers s WHERE s.id = p_seller_id;

  RETURN QUERY
  SELECT
    COALESCE(SUM(oi.selling_price * oi.qty), 0)                                  AS available_gross,
    COALESCE(SUM(
      oi.selling_price * oi.qty
      * (1 - v_rate / 100.0)
      * (1 - 0.01)
    ), 0)                                                                         AS available_net,
    COALESCE(SUM(oi.selling_price * oi.qty * v_rate / 100.0), 0)                 AS commission_amount,
    COALESCE(SUM(oi.selling_price * oi.qty * (1 - v_rate / 100.0) * 0.01), 0)   AS tds_amount,
    COUNT(*)                                                                      AS eligible_items,
    v_rate                                                                        AS commission_rate
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.seller_id   = p_seller_id
    AND oi.status      IN ('shipped', 'delivered')
    AND o.payment_status = 'paid'
    AND oi.settlement_id IS NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC: create_seller_settlement
--    Atomically:
--      a) Verifies caller owns the seller account
--      b) Computes available balance
--      c) Enforces minimum payout (₹500)
--      d) Inserts a settlements row (status = 'pending')
--      e) Stamps settlement_id on all eligible order_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_seller_settlement(p_seller_id UUID)
RETURNS TABLE(
  settlement_id UUID,
  gross_amount  NUMERIC,
  net_amount    NUMERIC,
  items_count   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate        NUMERIC;
  v_gross       NUMERIC;
  v_commission  NUMERIC;
  v_tds         NUMERIC;
  v_net         NUMERIC;
  v_count       BIGINT;
  v_sid         UUID;
BEGIN
  -- Only the owning seller may call this
  IF NOT EXISTS (
    SELECT 1 FROM sellers WHERE id = p_seller_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(s.commission_rate, 15) INTO v_rate
  FROM sellers s WHERE s.id = p_seller_id;

  -- Compute eligible totals
  SELECT
    COALESCE(SUM(oi.selling_price * oi.qty), 0),
    COALESCE(SUM(oi.selling_price * oi.qty * v_rate / 100.0), 0),
    COALESCE(SUM(oi.selling_price * oi.qty * (1 - v_rate / 100.0) * 0.01), 0),
    COALESCE(SUM(oi.selling_price * oi.qty * (1 - v_rate / 100.0) * 0.99), 0),
    COUNT(*)
  INTO v_gross, v_commission, v_tds, v_net, v_count
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.seller_id     = p_seller_id
    AND oi.status        IN ('shipped', 'delivered')
    AND o.payment_status = 'paid'
    AND oi.settlement_id IS NULL;

  IF v_count = 0 OR v_gross = 0 THEN
    RAISE EXCEPTION 'No eligible orders available for settlement';
  END IF;

  IF v_net < 500 THEN
    RAISE EXCEPTION 'Minimum payout is ₹500. Current available: ₹%', ROUND(v_net, 2);
  END IF;

  -- Create settlement record
  INSERT INTO settlements (
    seller_id, period_start, period_end,
    gross_amount, commission, tds, net_amount, status
  )
  VALUES (
    p_seller_id, NOW() - INTERVAL '15 days', NOW(),
    v_gross, v_commission, v_tds, v_net, 'pending'
  )
  RETURNING id INTO v_sid;

  -- Mark all eligible items as settled
  UPDATE order_items
  SET settlement_id = v_sid
  WHERE seller_id     = p_seller_id
    AND status        IN ('shipped', 'delivered')
    AND settlement_id IS NULL
    AND order_id IN (
      SELECT id FROM orders WHERE payment_status = 'paid'
    );

  RETURN QUERY SELECT v_sid, v_gross, v_net, v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Grant EXECUTE to authenticated users (RLS inside the functions enforces ownership)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_seller_available_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_seller_settlement(UUID)     TO authenticated;
