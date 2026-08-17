-- Fix: seller-created brands were invisible to buyers on the web app.
--
-- Root cause: the "Brands read" policy in 20250516000004_seller_brands.sql
-- restricted SELECT to rows where seller_id IS NULL OR seller_id belongs to
-- the current authenticated user. Unauthenticated buyers always have
-- auth.uid()=null so every seller brand was hidden from the PLP filter.
--
-- A single "allow all active" policy would over-expose: authenticated sellers
-- in the seller portal would see other sellers' private brands.
--
-- Correct model — two role-scoped policies:
--
--   anon  (unauthenticated buyer on web app)
--     → all active brands are readable (needed for PLP brand filter)
--
--   authenticated — further split by whether the user IS a seller:
--     buyer (not in sellers table) → all active brands
--     seller (in sellers table)    → platform brands + their own only
--
-- Write policies (insert/update/delete) are unchanged.

DROP POLICY IF EXISTS "Brands read"       ON brands;
DROP POLICY IF EXISTS "Brands anon read"  ON brands;
DROP POLICY IF EXISTS "Brands auth read"  ON brands;

-- Anonymous visitors: full read on all active brands
CREATE POLICY "Brands anon read" ON brands FOR SELECT
  TO anon
  USING (active = TRUE);

-- Authenticated users:
--   if NOT a seller → behave like a buyer, see all active brands
--   if IS a seller  → see only platform brands + their own brands
CREATE POLICY "Brands auth read" ON brands FOR SELECT
  TO authenticated
  USING (
    active = TRUE
    AND (
      seller_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM sellers WHERE user_id = auth.uid())
      OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );
