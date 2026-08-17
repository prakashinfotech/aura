-- Add hsn_code and country_of_origin directly to products table
-- (previously only stored in product_attributes, which had no reliable write path)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hsn_code          TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

-- Ensure product_attributes write RLS exists
-- (actual columns are attribute_name / attribute_value, not key / value)
DROP POLICY IF EXISTS "Attrs seller manage" ON product_attributes;
CREATE POLICY "Attrs seller manage" ON product_attributes
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );

-- Same for product_tags
DROP POLICY IF EXISTS "Tags seller manage" ON product_tags;
CREATE POLICY "Tags seller manage" ON product_tags
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );
