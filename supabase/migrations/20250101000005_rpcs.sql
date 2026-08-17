-- Migration 006: RPCs

CREATE OR REPLACE FUNCTION get_products_filtered(
  p_category_slug TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_brand_ids UUID[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_discount INTEGER DEFAULT NULL,
  p_sizes TEXT[] DEFAULT NULL,
  p_colors TEXT[] DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'relevance',
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  brand_name TEXT,
  selling_price NUMERIC,
  mrp NUMERIC,
  discount_pct INTEGER,
  rating_avg NUMERIC,
  rating_count INTEGER,
  primary_image_url TEXT,
  blur_data_url TEXT,
  in_stock BOOLEAN,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH filtered AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      b.name AS brand_name,
      MIN(pv.selling_price) AS selling_price,
      MIN(pv.mrp) AS mrp,
      ROUND(((MIN(pv.mrp) - MIN(pv.selling_price)) / MIN(pv.mrp) * 100))::INTEGER AS discount_pct,
      p.rating_avg,
      p.rating_count,
      (SELECT pi.url FROM product_images pi
       WHERE pi.product_id = p.id AND pi.is_primary = TRUE
       ORDER BY pi.sort_order LIMIT 1) AS primary_image_url,
      (SELECT pi.blur_data_url FROM product_images pi
       WHERE pi.product_id = p.id AND pi.is_primary = TRUE
       ORDER BY pi.sort_order LIMIT 1) AS blur_data_url,
      (EXISTS(SELECT 1 FROM product_variants pv2
              WHERE pv2.product_id = p.id AND pv2.stock_qty > 0)) AS in_stock,
      COUNT(*) OVER() AS total_count
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE
      p.status = 'active'
      AND p.deleted_at IS NULL
      AND (p_category_slug IS NULL OR c.slug = p_category_slug OR c.slug LIKE p_category_slug || '%')
      AND (p_search IS NULL OR p.search_vector @@ plainto_tsquery('english', p_search)
           OR p.title ILIKE '%' || p_search || '%')
      AND (p_brand_ids IS NULL OR p.brand_id = ANY(p_brand_ids))
      AND (p_min_price IS NULL OR pv.selling_price >= p_min_price)
      AND (p_max_price IS NULL OR pv.selling_price <= p_max_price)
      AND (p_min_discount IS NULL OR
           ROUND((pv.mrp - pv.selling_price) / pv.mrp * 100) >= p_min_discount)
      AND (p_sizes IS NULL OR pv.size = ANY(p_sizes))
      AND (p_colors IS NULL OR pv.color = ANY(p_colors))
      AND (p_min_rating IS NULL OR p.rating_avg >= p_min_rating)
      AND (p_gender IS NULL OR p.gender = p_gender)
    GROUP BY p.id, b.name, p.title, p.slug, p.rating_avg, p.rating_count
  )
  SELECT *
  FROM filtered
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN selling_price END ASC,
    CASE WHEN p_sort = 'price_desc' THEN selling_price END DESC,
    CASE WHEN p_sort = 'rating' THEN rating_avg END DESC,
    CASE WHEN p_sort = 'discount' THEN discount_pct END DESC,
    CASE WHEN p_sort = 'newest' THEN (SELECT created_at FROM products WHERE id = filtered.id) END DESC,
    id ASC
  -- ✅ SECURITY: Cap limit at 100 to prevent DoS (memory exhaustion)
  LIMIT LEAST(COALESCE(p_limit, 20), 100)
  OFFSET (p_page - 1) * LEAST(COALESCE(p_limit, 20), 100);
$$;


CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_address_id UUID,
  p_variant_ids UUID[],
  p_quantities INTEGER[],
  p_coupon_code TEXT DEFAULT NULL,
  p_razorpay_order_id TEXT DEFAULT NULL,
  p_razorpay_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE (order_id UUID, total NUMERIC, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal NUMERIC := 0;
  v_delivery NUMERIC := 0;
  v_total NUMERIC := 0;
  v_variant RECORD;
  i INTEGER;
BEGIN
  -- Validate stock
  FOR i IN 1..array_length(p_variant_ids, 1) LOOP
    SELECT pv.*, s.id AS seller_id INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN sellers s ON s.id = p.seller_id
    WHERE pv.id = p_variant_ids[i];

    IF NOT FOUND THEN
      RETURN QUERY SELECT NULL::UUID, 0::NUMERIC, 'VARIANT_NOT_FOUND';
      RETURN;
    END IF;

    IF v_variant.stock_qty < p_quantities[i] THEN
      RETURN QUERY SELECT NULL::UUID, 0::NUMERIC, 'INSUFFICIENT_STOCK';
      RETURN;
    END IF;

    v_subtotal := v_subtotal + (v_variant.selling_price * p_quantities[i]);
  END LOOP;

  v_delivery := CASE WHEN v_subtotal >= 499 THEN 0 ELSE 49 END;
  v_total := v_subtotal + v_delivery;

  -- Create order
  INSERT INTO orders (user_id, address_id, subtotal, delivery_charge, total,
                      payment_status, razorpay_order_id, razorpay_payment_id)
  VALUES (p_user_id, p_address_id, v_subtotal, v_delivery, v_total,
          CASE WHEN p_razorpay_payment_id IS NOT NULL THEN 'paid' ELSE 'pending' END,
          p_razorpay_order_id, p_razorpay_payment_id)
  RETURNING id INTO v_order_id;

  -- Insert order items + decrement stock
  FOR i IN 1..array_length(p_variant_ids, 1) LOOP
    SELECT pv.*, s.id AS seller_id INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN sellers s ON s.id = p.seller_id
    WHERE pv.id = p_variant_ids[i];

    INSERT INTO order_items (order_id, product_id, variant_id, seller_id, qty, mrp, selling_price)
    VALUES (v_order_id, v_variant.product_id, v_variant.id, v_variant.seller_id,
            p_quantities[i], v_variant.mrp, v_variant.selling_price);

    UPDATE product_variants
    SET stock_qty = stock_qty - p_quantities[i]
    WHERE id = v_variant.id;
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_total, NULL::TEXT;
END;
$$;


-- Apply coupon helper
CREATE OR REPLACE FUNCTION apply_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_order_total NUMERIC
)
RETURNS TABLE (discount NUMERIC, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_code)
    AND active = TRUE
    AND valid_from <= NOW()
    AND valid_until >= NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 'COUPON_NOT_FOUND';
    RETURN;
  END IF;

  IF p_order_total < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT 0::NUMERIC, 'MIN_ORDER_NOT_MET';
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT 0::NUMERIC, 'COUPON_EXHAUSTED';
    RETURN;
  END IF;

  IF EXISTS(SELECT 1 FROM coupon_usages WHERE coupon_id = v_coupon.id AND user_id = p_user_id) THEN
    RETURN QUERY SELECT 0::NUMERIC, 'ALREADY_USED';
    RETURN;
  END IF;

  DECLARE v_discount NUMERIC;
  BEGIN
    IF v_coupon.type = 'flat' THEN
      v_discount := v_coupon.value;
    ELSIF v_coupon.type = 'percent' THEN
      v_discount := (p_order_total * v_coupon.value / 100);
      IF v_coupon.max_discount IS NOT NULL THEN
        v_discount := LEAST(v_discount, v_coupon.max_discount);
      END IF;
    ELSE
      v_discount := 0;
    END IF;
    RETURN QUERY SELECT v_discount, NULL::TEXT;
  END;
END;
$$;
