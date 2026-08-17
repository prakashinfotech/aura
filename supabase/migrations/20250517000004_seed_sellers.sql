-- ─────────────────────────────────────────────────────────────────────────────
-- Seed the three seller rows that all seeded products reference.
-- user_id is intentionally NULL here — run the helper below to link them
-- to an actual Supabase Auth account.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO sellers (id, user_id, store_name, status, commission_rate)
VALUES
  ('00000000-0004-0001-0000-000000000000', NULL, 'FashionHub Store',  'approved', 15),
  ('00000000-0004-0002-0000-000000000000', NULL, 'SportZone Store',   'approved', 15),
  ('00000000-0004-0003-0000-000000000000', NULL, 'TrendWear Store',   'approved', 15)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: link your seller account to the seeded products.
-- After registering in the seller app, run this once in the SQL Editor:
--
--   SELECT link_seller_to_seed_products('<your-seller-email@example.com>');
--
-- This will:
--   1. Find your auth user ID by email
--   2. Delete the auto-created seller row from registration (wrong UUID)
--   3. Update the first seeded seller row to own your user_id
--   4. Reassign ALL seeded products to that seeded seller ID
--   So products.seller_id and your sellers.id now match.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION link_seller_to_seed_products(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_profile_id   UUID;
  v_old_seller   UUID;
  v_seed_seller  UUID := '00000000-0004-0001-0000-000000000000';
BEGIN
  -- 1. Resolve the auth user
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN 'ERROR: No auth user found with email ' || p_email;
  END IF;

  SELECT id INTO v_profile_id FROM profiles WHERE id = v_user_id;
  IF v_profile_id IS NULL THEN
    RETURN 'ERROR: No profile row for user ' || v_user_id::TEXT;
  END IF;

  -- 2. Remove the auto-created seller row from registration (if any)
  SELECT id INTO v_old_seller FROM sellers WHERE user_id = v_user_id;
  IF v_old_seller IS NOT NULL AND v_old_seller <> v_seed_seller THEN
    DELETE FROM sellers WHERE id = v_old_seller;
  END IF;

  -- 3. Link the seeded seller to this user
  UPDATE sellers
  SET user_id = v_user_id, status = 'approved'
  WHERE id = v_seed_seller;

  -- 4. Reassign all seeded seller products to the canonical seed seller
  --    (seller 2 and 3 products go to seller 1 so one login sees everything)
  UPDATE products
  SET seller_id = v_seed_seller
  WHERE seller_id IN (
    '00000000-0004-0001-0000-000000000000',
    '00000000-0004-0002-0000-000000000000',
    '00000000-0004-0003-0000-000000000000'
  );

  RETURN 'OK: seller ' || v_seed_seller::TEXT || ' linked to ' || p_email
      || '. All seeded products now belong to this seller.';
END;
$$;
