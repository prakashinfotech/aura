-- ─────────────────────────────────────────────────────────────────────────────
-- 0. review_photos — table-level grants (needed alongside RLS policies)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT                ON review_photos TO anon, authenticated;
GRANT INSERT, DELETE        ON review_photos TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. review_photos — enable RLS + policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_photos public read"   ON review_photos;
CREATE POLICY "review_photos public read" ON review_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_photos owner insert"  ON review_photos;
CREATE POLICY "review_photos owner insert" ON review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "review_photos owner delete"  ON review_photos;
CREATE POLICY "review_photos owner delete" ON review_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. reviews — one review per user per product (UPSERT path needs this)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_product_user_unique;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_product_user_unique UNIQUE (product_id, user_id);

-- Also allow users to UPDATE their own review (needed for edit)
DROP POLICY IF EXISTS "reviews owner update" ON reviews;
CREATE POLICY "reviews owner update" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Storage bucket for review photos
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "review photos public read"   ON storage.objects;
CREATE POLICY "review photos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');

DROP POLICY IF EXISTS "review photos auth upload"   ON storage.objects;
CREATE POLICY "review photos auth upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-photos'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "review photos owner delete"  ON storage.objects;
CREATE POLICY "review photos owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. get_products_filtered — rating filter only matches products with real reviews
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_products_filtered(
  p_category_slug TEXT    DEFAULT NULL,
  p_search        TEXT    DEFAULT NULL,
  p_brand_ids     UUID[]  DEFAULT NULL,
  p_min_price     NUMERIC DEFAULT NULL,
  p_max_price     NUMERIC DEFAULT NULL,
  p_min_discount  INTEGER DEFAULT NULL,
  p_sizes         TEXT[]  DEFAULT NULL,
  p_colors        TEXT[]  DEFAULT NULL,
  p_min_rating    NUMERIC DEFAULT NULL,
  p_gender        TEXT    DEFAULT NULL,
  p_sort          TEXT    DEFAULT 'relevance',
  p_page          INTEGER DEFAULT 1,
  p_limit         INTEGER DEFAULT 20
)
RETURNS TABLE (
  id               UUID,
  title            TEXT,
  slug             TEXT,
  brand_name       TEXT,
  selling_price    NUMERIC,
  mrp              NUMERIC,
  discount_pct     INTEGER,
  rating_avg       NUMERIC,
  rating_count     INTEGER,
  primary_image_url TEXT,
  blur_data_url    TEXT,
  in_stock         BOOLEAN,
  total_count      BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH filtered AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      b.name                                                          AS brand_name,
      MIN(pv.selling_price)                                           AS selling_price,
      MIN(pv.mrp)                                                     AS mrp,
      ROUND(((MIN(pv.mrp) - MIN(pv.selling_price))
              / MIN(pv.mrp) * 100))::INTEGER                         AS discount_pct,
      p.rating_avg,
      p.rating_count,
      (SELECT pi.url FROM product_images pi
       WHERE pi.product_id = p.id AND pi.is_primary = TRUE
       ORDER BY pi.sort_order LIMIT 1)                               AS primary_image_url,
      (SELECT pi.blur_data_url FROM product_images pi
       WHERE pi.product_id = p.id AND pi.is_primary = TRUE
       ORDER BY pi.sort_order LIMIT 1)                               AS blur_data_url,
      (EXISTS(SELECT 1 FROM product_variants pv2
              WHERE pv2.product_id = p.id AND pv2.stock_qty > 0))    AS in_stock,
      COUNT(*) OVER()                                                 AS total_count
    FROM products p
    LEFT JOIN brands          b  ON b.id  = p.brand_id
    LEFT JOIN categories      c  ON c.id  = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE
      p.status     = 'active'
      AND p.deleted_at IS NULL
      AND (p_category_slug IS NULL
           OR c.slug = p_category_slug
           OR c.slug LIKE p_category_slug || '%')
      AND (p_search IS NULL
           OR p.search_vector @@ plainto_tsquery('english', p_search)
           OR p.title ILIKE '%' || p_search || '%')
      AND (p_brand_ids   IS NULL OR p.brand_id         = ANY(p_brand_ids))
      AND (p_min_price   IS NULL OR pv.selling_price   >= p_min_price)
      AND (p_max_price   IS NULL OR pv.selling_price   <= p_max_price)
      AND (p_min_discount IS NULL
           OR ROUND((pv.mrp - pv.selling_price) / pv.mrp * 100) >= p_min_discount)
      AND (p_sizes  IS NULL OR pv.size  = ANY(p_sizes))
      AND (p_colors IS NULL OR pv.color = ANY(p_colors))
      -- Rating filter: only include products that have REAL reviews in the reviews table
      AND (p_min_rating IS NULL
           OR (p.rating_avg >= p_min_rating
               AND EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id)))
      AND (p_gender IS NULL OR p.gender = p_gender)
    GROUP BY p.id, b.name, p.title, p.slug, p.rating_avg, p.rating_count
  )
  SELECT *
  FROM filtered
  ORDER BY
    CASE WHEN p_sort = 'price_asc'  THEN selling_price END ASC,
    CASE WHEN p_sort = 'price_desc' THEN selling_price END DESC,
    CASE WHEN p_sort = 'rating'     THEN rating_avg    END DESC,
    CASE WHEN p_sort = 'discount'   THEN discount_pct  END DESC,
    CASE WHEN p_sort = 'newest'
         THEN (SELECT created_at FROM products WHERE id = filtered.id) END DESC,
    id ASC
  LIMIT  p_limit
  OFFSET (p_page - 1) * p_limit;
$$;
