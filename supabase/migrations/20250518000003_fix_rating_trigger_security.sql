-- Fix: update_product_rating() ran as the invoking user (the buyer).
-- The "Products seller manage own" RLS policy blocks any UPDATE on products
-- from non-seller users, so the trigger silently wrote nothing — rating_avg
-- and rating_count were never updated after real reviews were submitted.
--
-- Fix: recreate the function with SECURITY DEFINER so it executes as the
-- function owner (postgres), bypassing RLS for this internal aggregation.
--
-- Also backfill all products whose ratings were missed by previous reviews.

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    rating_avg   = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: apply all existing reviews that were silently dropped before this fix
UPDATE products p
SET
  rating_avg   = sub.avg_rating,
  rating_count = sub.cnt
FROM (
  SELECT
    product_id,
    ROUND(AVG(rating)::NUMERIC, 2) AS avg_rating,
    COUNT(*)                        AS cnt
  FROM reviews
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;
