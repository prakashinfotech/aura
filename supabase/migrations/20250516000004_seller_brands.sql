-- Migration: Seller Brands + Write RLS Fixes + product-images storage bucket
-- Fixes the following gaps:
--   1. brands.seller_id — sellers can own custom brands
--   2. product_variants / product_images / product_attributes / product_tags
--      were missing seller write policies (only had public-read)
--   3. product-images Supabase Storage bucket with RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add seller_id to brands ───────────────────────────────────────────────
--   NULL  = platform brand (Nike, Puma …) visible to ALL sellers
--   value = private brand owned by that seller, visible only to them

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_brands_seller
  ON brands(seller_id) WHERE seller_id IS NOT NULL;

-- ── 2. Update brand RLS policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Brands public read"    ON brands;
DROP POLICY IF EXISTS "Brands read"            ON brands;
DROP POLICY IF EXISTS "Brands seller insert"   ON brands;
DROP POLICY IF EXISTS "Brands seller update"   ON brands;
DROP POLICY IF EXISTS "Brands seller delete"   ON brands;

-- Any authenticated user can see global (seller_id IS NULL) and their own brands
CREATE POLICY "Brands read" ON brands FOR SELECT
  USING (
    active = TRUE
    AND (
      seller_id IS NULL
      OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );

-- Sellers may create brands under their own seller_id
CREATE POLICY "Brands seller insert" ON brands FOR INSERT
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

-- Sellers may update/delete their own brands only
CREATE POLICY "Brands seller update" ON brands FOR UPDATE
  USING   (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Brands seller delete" ON brands FOR DELETE
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- ── 3. product_variants write RLS (was missing — only had public-read) ───────
DROP POLICY IF EXISTS "Variants seller manage" ON product_variants;
CREATE POLICY "Variants seller manage" ON product_variants
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

-- ── 4. product_images write RLS (was missing — only had public-read) ─────────
DROP POLICY IF EXISTS "Images seller manage" ON product_images;
CREATE POLICY "Images seller manage" ON product_images
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

-- ── 5. product_attributes write RLS (was missing — only had public-read) ─────
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

-- ── 6. product_tags write RLS (was missing — only had public-read) ───────────
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

-- ── 7. product-images Supabase Storage bucket ────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_upload" ON storage.objects;
CREATE POLICY "product_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_read" ON storage.objects;
CREATE POLICY "product_images_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');
