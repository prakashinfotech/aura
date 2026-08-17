-- ─────────────────────────────────────────────────────────────────────────────
-- order_items — add missing INSERT policy + buyer SELECT policy
--
-- Root cause: order_items had RLS enabled but no INSERT policy, so the
-- payment-verify route (running as the buyer) could not insert order_items.
-- Result: orders were created but order_items were empty → sellers saw nothing.
-- ─────────────────────────────────────────────────────────────────────────────

-- Buyers can see their own order items (for the account/orders page)
DROP POLICY IF EXISTS "Order items buyer own" ON order_items;
CREATE POLICY "Order items buyer own" ON order_items
  FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Sellers can update status/tracking on their own items (accept, dispatch)
DROP POLICY IF EXISTS "Order items seller update" ON order_items;
CREATE POLICY "Order items seller update" ON order_items
  FOR UPDATE
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Explicit table-level grants (required alongside RLS policies)
GRANT SELECT                  ON order_items TO authenticated;
GRANT UPDATE (status, tracking_number, courier, dispatched_at, delivered_at)
                              ON order_items TO authenticated;
