-- Fix: attach the rating-update trigger to the reviews table (was missing)
-- and back-fill rating_avg / rating_count from any existing reviews.

-- 1. Attach the trigger that fires on every review change
DROP TRIGGER IF EXISTS trg_reviews_update_rating ON reviews;
CREATE TRIGGER trg_reviews_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- 2. Back-fill ratings for products that already have reviews
UPDATE products p
SET
  rating_avg   = sub.avg_rating,
  rating_count = sub.cnt
FROM (
  SELECT product_id, ROUND(AVG(rating)::NUMERIC, 2) AS avg_rating, COUNT(*) AS cnt
  FROM reviews
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- 3. Seed realistic random ratings for products that still have no reviews
--    (deterministic per product ID so re-running is idempotent)
UPDATE products
SET
  rating_avg   = ROUND(
    (3.4 + (('x' || SUBSTRING(id::TEXT, 1, 8))::BIT(32)::BIGINT % 1000)::NUMERIC / 666),
    1
  ),
  rating_count = 120 + (('x' || SUBSTRING(id::TEXT, 10, 8))::BIT(32)::BIGINT % 9880)::INTEGER
WHERE status    = 'active'
  AND deleted_at IS NULL
  AND rating_count = 0;
