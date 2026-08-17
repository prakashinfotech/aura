# Database Schema Overview

## Tables by Module

### 🔐 Authentication & Users (5 tables)

```sql
profiles {
  id UUID PRIMARY KEY           -- References auth.users
  name TEXT
  email TEXT UNIQUE
  phone TEXT UNIQUE
  avatar_url TEXT               -- Avatar from Supabase Storage
  gender ENUM (male,female,unisex,prefer_not_to_say)
  dob DATE
  insider_tier ENUM (silver,gold,platinum)
  insider_points INTEGER
  deleted_at TIMESTAMPTZ        -- Soft delete
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

addresses {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  name TEXT
  phone TEXT
  line1 TEXT                    -- Street address
  line2 TEXT                    -- Apt/Suite
  city TEXT
  state TEXT
  pincode TEXT
  type ENUM (home,work,other)
  is_default BOOLEAN
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

user_flags {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  flag_type TEXT                -- 'suspected_fraud', 'vat_check', etc.
  reason TEXT
  created_at TIMESTAMPTZ
}

login_attempts {
  id UUID PRIMARY KEY
  ip TEXT                       -- Client IP for security
  identifier TEXT               -- Email or phone
  ts TIMESTAMPTZ
}

insider_tiers {
  id UUID PRIMARY KEY
  name ENUM (silver,gold,platinum)
  points_threshold INTEGER
  benefits JSONB
  created_at TIMESTAMPTZ
}
```

---

### 🏪 Sellers & Catalog (9 tables)

```sql
sellers {
  id UUID PRIMARY KEY
  user_id UUID UNIQUE FK → profiles
  store_name TEXT
  gstin TEXT                    -- India GST number
  pan TEXT                      -- India PAN
  status ENUM (pending,approved,suspended,rejected)
  rating_avg NUMERIC(3,2)       -- Aggregated from reviews
  rating_count INTEGER
  commission_rate NUMERIC(5,2)  -- % commission to Aura
  bank_account_verified BOOLEAN
  deleted_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

categories {
  id UUID PRIMARY KEY
  name TEXT
  slug TEXT UNIQUE              -- URL-friendly: "men-shirts"
  parent_id UUID FK → categories  -- For hierarchies
  icon_url TEXT
  display_order INTEGER
  active BOOLEAN
  created_at TIMESTAMPTZ
}

brands {
  id UUID PRIMARY KEY
  name TEXT
  slug TEXT UNIQUE
  logo_url TEXT
  description TEXT
  active BOOLEAN
  created_at TIMESTAMPTZ
}

seller_brands {
  seller_id UUID FK → sellers
  brand_id UUID FK → brands
  approved_at TIMESTAMPTZ
  
  PRIMARY KEY (seller_id, brand_id)
}

products {
  id UUID PRIMARY KEY
  title TEXT
  slug TEXT UNIQUE              -- URL: "nike-air-max-street"
  brand_id UUID FK → brands
  category_id UUID FK → categories
  seller_id UUID FK → sellers   -- Single seller per product
  description TEXT
  gender ENUM (men,women,boys,girls,unisex)
  status ENUM (active,inactive,discontinued)
  
  -- Compliance
  hsn_code TEXT                 -- India HSN for GST
  gst_slab TEXT                 -- 5%, 12%, 18%, etc.
  material TEXT
  
  -- Ratings (denormalized for performance)
  rating_avg NUMERIC(3,2)
  rating_count INTEGER
  
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

product_variants {
  id UUID PRIMARY KEY
  product_id UUID FK → products
  size TEXT                     -- "M", "L", "UK 8", etc.
  color TEXT
  color_hex TEXT                -- "#000000"
  sku TEXT UNIQUE               -- "NIKE-AIR-MAX-BLK-M"
  stock_qty INTEGER             -- Available units
  
  -- Pricing
  mrp NUMERIC                   -- Maximum Retail Price (list price)
  selling_price NUMERIC         -- Our sale price
  cost_price NUMERIC            -- Seller's cost (for settlement calc)
  
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

product_images {
  id UUID PRIMARY KEY
  product_id UUID FK → products
  url TEXT                      -- Supabase Storage URL
  blur_data_url TEXT            -- Placeholder while loading
  sort_order INTEGER            -- 0 = primary image
  is_primary BOOLEAN
  created_at TIMESTAMPTZ
}
```

---

### 🛒 Shopping & Orders (9 tables)

```sql
carts {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  product_variant_id UUID FK → product_variants
  quantity INTEGER
  added_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

orders {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  seller_id UUID FK → sellers   -- Single seller per order
  status ENUM (pending, confirmed, shipped, delivered, cancelled, returned)
  
  -- Totals
  subtotal NUMERIC              -- Sum of line items
  discount NUMERIC              -- Coupon/promo discount
  tax NUMERIC                   -- Calculated GST
  shipping_charge NUMERIC
  total NUMERIC                 -- Grand total
  
  -- Payment
  payment_method TEXT           -- 'razorpay', 'upi', 'wallet'
  razorpay_order_id TEXT
  razorpay_payment_id TEXT
  paid_at TIMESTAMPTZ
  
  -- Delivery
  delivery_address_id UUID FK → addresses
  tracking_number TEXT
  expected_delivery_date DATE
  
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

order_items {
  id UUID PRIMARY KEY
  order_id UUID FK → orders
  product_variant_id UUID FK → product_variants
  product_title TEXT            -- Denormalized (snapshot)
  quantity INTEGER
  price NUMERIC                 -- Price per unit at purchase time
  discount NUMERIC              -- Line-item discount if any
  tax NUMERIC
  total NUMERIC
  created_at TIMESTAMPTZ
}

order_events {
  id UUID PRIMARY KEY
  order_id UUID FK → orders
  event_type ENUM (
    created,          -- Order placed
    confirmed,        -- Seller confirmed
    packed,           -- Ready to ship
    shipped,          -- In transit
    delivered,        -- Arrived
    cancelled,        -- Cancelled by buyer/seller
    returned,         -- RMA initiated
    settlement_done   -- Payout processed
  )
  notes TEXT
  created_at TIMESTAMPTZ
}

shipments {
  id UUID PRIMARY KEY
  order_id UUID FK → orders
  tracking_id TEXT              -- Carrier tracking number
  carrier TEXT                  -- 'fedex', 'dhl', 'india-post'
  status ENUM (pending,picked,in_transit,delivered)
  shipped_date TIMESTAMPTZ
  expected_delivery TIMESTAMPTZ
  delivered_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

order_reviews {
  id UUID PRIMARY KEY
  order_id UUID FK → orders
  user_id UUID FK → profiles    -- Buyer
  rating INTEGER CHECK (1-5)
  review_text TEXT
  is_verified BOOLEAN           -- Verified purchase
  helpful_count INTEGER
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

review_photos {
  id UUID PRIMARY KEY
  order_review_id UUID FK → order_reviews
  url TEXT                      -- Supabase Storage URL
  sort_order INTEGER
  created_at TIMESTAMPTZ
}

carts {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  product_variant_id UUID FK → product_variants
  quantity INTEGER
  added_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}
```

---

### 💰 Financial & Settlements (6 tables)

```sql
order_settlements {
  id UUID PRIMARY KEY
  order_id UUID FK → orders
  seller_settlement_id UUID FK → seller_settlements
  order_amount NUMERIC          -- Total order value
  commission_amount NUMERIC     -- Aura's fee
  settlement_amount NUMERIC     -- Seller gets this
  status ENUM (pending,approved,paid)
  created_at TIMESTAMPTZ
}

seller_settlements {
  id UUID PRIMARY KEY
  seller_id UUID FK → sellers
  period_start DATE             -- Settlement period
  period_end DATE
  order_count INTEGER
  gross_amount NUMERIC          -- Total orders
  commission NUMERIC            -- Aura's cut
  deductions NUMERIC            -- Returns, chargebacks
  net_amount NUMERIC            -- Seller gets this
  status ENUM (pending,approved,paid,failed)
  payment_method TEXT           -- 'bank_transfer', 'upi'
  bank_reference TEXT           -- Transaction ID
  paid_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

seller_ledger {
  id UUID PRIMARY KEY
  seller_id UUID FK → sellers
  transaction_type ENUM (
    order_revenue,              -- Sale
    commission_deducted,        -- Aura fee
    return_refund,              -- Return credit
    settlement_paid,            -- Payout
    adjustment,                 -- Admin adjustment
    dispute_charge              -- Chargeback/dispute
  )
  amount NUMERIC                -- Can be negative
  reference_id UUID             -- Links to order_id, return_id, etc.
  notes TEXT
  balance_after NUMERIC         -- Running balance
  created_at TIMESTAMPTZ
}

coupons {
  id UUID PRIMARY KEY
  code TEXT UNIQUE              -- 'SUMMER20', 'WELCOME10'
  discount_type ENUM (percentage, fixed)
  discount_value NUMERIC        -- 20 for 20%, or 100 for ₹100
  min_order_value NUMERIC       -- Minimum basket size
  max_discount NUMERIC          -- Cap the discount
  usage_limit INTEGER           -- Total uses allowed
  usage_count INTEGER           -- Current uses
  valid_from TIMESTAMPTZ
  valid_till TIMESTAMPTZ
  active BOOLEAN
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

coupon_usage {
  id UUID PRIMARY KEY
  coupon_id UUID FK → coupons
  user_id UUID FK → profiles
  order_id UUID FK → orders
  discount_amount NUMERIC       -- Actual discount given
  used_at TIMESTAMPTZ
}

loyalty_redemptions {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  points_spent INTEGER
  reward_type TEXT              -- 'discount', 'gift_card'
  reward_value NUMERIC
  redeemed_at TIMESTAMPTZ
}
```

---

### 🎯 Marketing & Promotions (2 tables)

```sql
banners {
  id UUID PRIMARY KEY
  image_url_desktop TEXT        -- 1280x320px
  image_url_mobile TEXT         -- 390x200px
  target_url TEXT               -- Where banner links to
  position ENUM (hero, sidebar, footer)
  active BOOLEAN
  sort_order INTEGER            -- Display order
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

loyalty_programs {
  id UUID PRIMARY KEY
  user_id UUID FK → profiles
  tier ENUM (silver,gold,platinum)
  points INTEGER                -- Accumulated loyalty points
  earned_on_amount NUMERIC      -- How much they've spent
  last_activity_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}
```

---

## Key Indexes

Performance-critical indexes automatically created:

```sql
-- Products & Search
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_gender ON products(gender);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_variant_id ON order_items(product_variant_id);

-- Reviews & Ratings
CREATE INDEX idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX idx_order_reviews_user_id ON order_reviews(user_id);
CREATE INDEX idx_review_photos_order_review_id ON review_photos(order_review_id);

-- Cart
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_product_variant_id ON carts(product_variant_id);

-- Addresses
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- Settlements
CREATE INDEX idx_order_settlements_order_id ON order_settlements(order_id);
CREATE INDEX idx_order_settlements_status ON order_settlements(status);
CREATE INDEX idx_seller_settlements_seller_id ON seller_settlements(seller_id);
CREATE INDEX idx_seller_settlements_status ON seller_settlements(status);
CREATE INDEX idx_seller_ledger_seller_id ON seller_ledger(seller_id);
```

---

## Full-Text Search Indexes

Enabled for product discovery:

```sql
-- Product search by title & description
CREATE INDEX idx_products_fts ON products 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Seller store name search
CREATE INDEX idx_sellers_store_fts ON sellers 
  USING gin(to_tsvector('english', store_name));

-- Review text search
CREATE INDEX idx_reviews_fts ON order_reviews 
  USING gin(to_tsvector('english', review_text));
```

---

## Row-Level Security (RLS)

Enabled on sensitive tables:

| Table | Who Can Read | Who Can Write |
|-------|------|------|
| `profiles` | Self + admins | Self |
| `addresses` | Self + admins | Self |
| `orders` | Buyer, seller in order, admins | Only order-creation API |
| `order_items` | Buyer, seller, admins | Only order-creation API |
| `order_reviews` | Public (read), buyer+admin (write) | Buyer who ordered |
| `seller_ledger` | Seller themselves + admins | Admin only |
| `seller_settlements` | Seller + admins | Admin + system |
| `carts` | Self | Self |

All other tables use public read (with appropriate API-level authorization).

---

## Data Types & Constraints

### UUIDs
All primary keys are `UUID DEFAULT gen_random_uuid()` for security & distributed uniqueness.

### Pricing
All currency amounts use `NUMERIC` (not FLOAT) for precision:
- `NUMERIC` = arbitrary precision decimal
- Never loses cents to floating-point rounding

### Timestamps
- `created_at TIMESTAMPTZ DEFAULT NOW()` — Set once, never changes
- `updated_at TIMESTAMPTZ DEFAULT NOW()` — Auto-updated via trigger
- `deleted_at TIMESTAMPTZ` — Soft deletes (NULL = not deleted)

### Enums
Custom types for strict domain values (status, payment method, etc.):
```sql
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'
);
```

### Foreign Keys
All FKs use `ON DELETE CASCADE` or `ON DELETE RESTRICT` as appropriate:
- **CASCADE**: Orders/items deleted when seller deleted
- **RESTRICT**: Can't delete brand if products use it

---

## Triggers

Automatic database-level triggers:

```sql
-- Auto-update timestamps
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Similar for: profiles, orders, sellers, addresses, products

-- Aggregate review ratings
CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Aggregate seller ratings
CREATE TRIGGER trg_update_seller_rating
  AFTER INSERT OR UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();
```

---

## Views (Optional for Convenience)

Common queries pre-computed as views:

```sql
-- Top products this month
CREATE VIEW top_products_this_month AS
SELECT p.id, p.title, p.slug, COUNT(*) as order_count, SUM(oi.quantity) as qty
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= DATE_TRUNC('month', NOW())
GROUP BY p.id, p.title, p.slug
ORDER BY qty DESC LIMIT 100;

-- Seller dashboard summary
CREATE VIEW seller_dashboard_summary AS
SELECT 
  s.id, s.store_name, COUNT(DISTINCT o.id) as total_orders,
  SUM(oi.quantity) as total_items, SUM(ss.settlement_amount) as total_settled
FROM sellers s
LEFT JOIN orders o ON s.id = o.seller_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN seller_settlements ss ON s.id = ss.seller_id AND ss.status = 'paid'
GROUP BY s.id, s.store_name;
```

---

## Storage Buckets

Supabase Storage for media:

```
aura-prod/
  ├── product-images/
  │   ├── {product_id}/{image_id}.jpg
  │   └── {product_id}/thumb-{image_id}.jpg
  ├── review-photos/
  │   ├── {review_id}/{photo_id}.jpg
  │   └── {review_id}/thumb-{photo_id}.jpg
  └── avatars/
      └── {user_id}.jpg
```

Each bucket has RLS policies limiting access to appropriate users.

---

**Total Tables:** 23 | **Total Indexes:** 40+ | **Storage Buckets:** 3 | **RLS Policies:** 20+
