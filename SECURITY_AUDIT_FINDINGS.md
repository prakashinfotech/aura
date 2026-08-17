# Security Audit Findings — Aura Marketplace

Comprehensive security analysis completed. **3 Critical, 6 High, 5 Medium, 6 Low severity issues found.**

---

## 🔴 CRITICAL SEVERITY (Must Fix Before Launch)

### 1. Missing Authorization Check on Seller Dispatch API
**File:** `apps/seller/app/api/dispatch/route.ts` (Lines 23-115)
**Severity:** 🔴 CRITICAL
**Risk:** Seller A can update order-items belonging to Seller B

**Problem:**
```typescript
// ❌ VULNERABLE - No seller_id verification
const { orderItemId, action } = await req.json();
const db = admin(); // Bypasses RLS
await db.from("order_items").update({ status: "processing" })
  .eq("id", orderItemId) // No check that seller owns this order!
```

**Impact:** Any authenticated seller can fraudulently update any order's fulfillment status.

**Fix:**
```typescript
// ✅ SECURE - Verify seller ownership
const { data: { session } } = await supabase.auth.getSession();
const { data: seller } = await supabase
  .from("sellers")
  .select("id")
  .eq("user_id", session.user.id)
  .single();

// Verify seller owns this order_item
const { data: orderItem } = await supabase
  .from("order_items")
  .select("seller_id")
  .eq("id", orderItemId)
  .single();

if (orderItem.seller_id !== seller.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

// Now safe to update
await db.from("order_items")
  .update({ status: action })
  .eq("id", orderItemId)
  .eq("seller_id", seller.id); // Double-check with WHERE clause
```

**Timeline:** Fix immediately (today) before any production use

---

### 2. Insufficient RLS Policy on Product Images Storage Bucket
**File:** `supabase/migrations/20250516000004_seller_brands.sql` (Lines 129-142)
**Severity:** 🔴 CRITICAL
**Risk:** Sellers can delete/replace images for other sellers' products

**Problem:**
```sql
-- ❌ VULNERABLE - No path validation
CREATE POLICY "product_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');  -- Any file allowed
```

**Impact:** Seller A can delete or overwrite images for Seller B's products.

**Fix:**
```sql
-- ✅ SECURE - Validate ownership via seller ID in path
CREATE POLICY "product_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );
```

**Timeline:** Fix immediately (today)

---

### 3. Sensitive Data Exposure in Error Logs
**File:** `apps/web/app/api/orders/verify/route.ts` (Lines 131-139)
**Severity:** 🔴 CRITICAL
**Risk:** Logs expose seller IDs and order structure, aiding attackers

**Problem:**
```typescript
// ❌ VULNERABLE - Exposes sensitive seller info
console.error("[order_items insert failed]", {
  code: itemsError.code,
  message: itemsError.message,
  details: itemsError.details,
  sellerIds: [...new Set(orderItems.map((i) => i.seller_id))], // ← Exposed!
});
```

**Impact:** Monitoring systems/logs leak business logic and seller targeting information.

**Fix:**
```typescript
// ✅ SECURE - Redacted logging
console.error("[order_items insert failed]", {
  errorCode: itemsError.code,
  itemCount: orderItems.length,
  // No sensitive IDs or details in logs
});

// Use structured logging to secure service
if (process.env.SENTRY_DSN) {
  Sentry.captureException(itemsError, {
    tags: { operation: "order_items_insert" },
    // Sentry redacts sensitive data automatically
  });
}
```

**Timeline:** Fix immediately (today)

---

## 🟠 HIGH SEVERITY (Fix Before Production)

### 4. Missing Rate Limiting on Payment APIs
**File:** `apps/web/app/api/orders/create/route.ts` and `/orders/verify/route.ts`
**Severity:** 🟠 HIGH
**Risk:** DoS attacks, financial loss, email spam

**Problem:**
- No rate limiting on order creation
- No rate limiting on payment verification
- Attackers can create unlimited Razorpay orders
- Can trigger email spam and service disruption

**Fix:**
```typescript
// Install: npm install @upstash/ratelimit redis

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 orders per user per hour
});

export async function POST(req: Request) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `order_create:${session.user.id}`
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // Proceed with order creation...
}
```

**Timeline:** Fix before launch (1-2 days)

---

### 5. Weak Settlement Amount Validation
**File:** `apps/seller/app/api/settlements/request/route.ts` (Lines 26-39)
**Severity:** 🟠 HIGH
**Risk:** Silent failures, race conditions, unclear errors

**Problem:**
```typescript
// ❌ Validates config but not eligibility
const rpcError = await supabase.rpc("create_seller_settlement", { 
  p_seller_id: seller.id 
});
if (rpcError) {
  const msg = rpcError.message ?? "Settlement creation failed";
  // Unclear if it's a validation error or system error
}
```

**Fix:**
```typescript
// ✅ Pre-validate before attempting settlement
const { data: balance, error: balanceError } = await supabase.rpc(
  "get_seller_available_balance",
  { p_seller_id: seller.id }
);

if (balanceError || !balance || balance < 100) { // Minimum threshold
  return NextResponse.json(
    { error: "Insufficient balance for settlement. Minimum: ₹100" },
    { status: 400 }
  );
}

// Now create settlement with confidence
const { error: rpcError } = await supabase.rpc(
  "create_seller_settlement",
  { p_seller_id: seller.id }
);

if (rpcError) {
  return NextResponse.json(
    { error: "Settlement creation failed. Please try again." },
    { status: 500 }
  );
}
```

**Timeline:** Fix before launch (1 day)

---

### 6. Order Items Insertion Without Seller Validation
**File:** `apps/web/app/api/orders/verify/route.ts` (Lines 125-140)
**Severity:** 🟠 HIGH
**Risk:** Orders for non-existent sellers, orphaned data

**Problem:**
```typescript
// ❌ Doesn't verify seller_id exists
const { data: products } = await adminSupabase
  .from("products")
  .select("id, seller_id")
  .in("id", productIds);
  // seller_id from product could be invalid
```

**Fix:**
```typescript
// ✅ Validate seller exists before creating order_items
const { data: products } = await adminSupabase
  .from("products")
  .select("id, seller_id")
  .in("id", productIds);

// Verify all seller_ids exist
const sellerIds = [...new Set(products.map(p => p.seller_id))];
const { data: sellers } = await adminSupabase
  .from("sellers")
  .select("id")
  .in("id", sellerIds);

if (sellers.length !== sellerIds.length) {
  // Some sellers don't exist
  const validSellerIds = new Set(sellers.map(s => s.id));
  const invalidProducts = products.filter(
    p => !validSellerIds.has(p.seller_id)
  );
  
  return NextResponse.json(
    { error: `Products belong to invalid sellers: ${invalidProducts.map(p => p.id).join(", ")}` },
    { status: 400 }
  );
}

// Now safe to create order_items
```

**Timeline:** Fix before launch (1 day)

---

### 7. No CSRF Protection on Form Submissions
**File:** All API routes (dispatch, settlements)
**Severity:** 🟠 HIGH
**Risk:** Cross-site request forgery attacks

**Fix:**
```typescript
// Add to dispatch/route.ts and settlements/request/route.ts
export async function POST(req: Request) {
  // Verify request origin
  const origin = req.headers.get("origin");
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  // Verify request is same-site
  const referer = req.headers.get("referer");
  if (referer && !referer.startsWith(expectedOrigin!)) {
    return NextResponse.json(
      { error: "Invalid referer" },
      { status: 403 }
    );
  }

  // Proceed with request...
}
```

**Timeline:** Fix before launch (1 day)

---

### 8. Hardcoded Razorpay Account in Environment
**File:** `apps/seller/app/api/settlements/request/route.ts` (Line 160)
**Severity:** 🟠 HIGH
**Risk:** Payout interception if env exposed

**Fix:**
```typescript
// ✅ SECURE - Vault sensitive Razorpay IDs
// Use Supabase vault or AWS Secrets Manager
// Never expose in code or logs

// If using Supabase vault:
const { data: vaultSecret, error } = await supabase
  .rpc("get_vault_secret", { secret_name: "razorpay_account_number" });

const accountNumber = vaultSecret;

// For Razorpay webhook signature verification:
const signature = req.headers.get("x-razorpay-signature");
const expectedSignature = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
  .update(req.body)
  .digest("hex");

if (expectedSignature !== signature) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

**Timeline:** Fix before launch (1-2 days)

---

## 🟡 MEDIUM SEVERITY (Fix Before Launch)

### 9. Missing Input Validation on Avatar Upload
**File:** `apps/web/app/api/upload/avatar/route.ts` (Line 28)
**Severity:** 🟡 MEDIUM
**Risk:** Uploaded files with unexpected extensions

**Fix:**
```typescript
// ✅ Validate both MIME type AND file signature
const buffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(buffer);

// Check magic bytes (file signature)
function getFileType(bytes: Uint8Array) {
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  // WebP: RIFF ... WEBP
  if (bytes[0] === 0x52 && bytes[8] === 0x57) return "webp";
  return null;
}

const fileType = getFileType(uint8Array);
const mimeType = file.type;

// Whitelist allowed types
const allowedTypes = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

if (!allowedTypes[mimeType] || !fileType || allowedTypes[mimeType] !== fileType) {
  return NextResponse.json(
    { error: "Invalid image format. Use PNG, JPEG, or WebP." },
    { status: 400 }
  );
}

const ext = fileType;
const path = `${user.id}/avatar.${ext}`;
```

**Timeline:** Fix before launch (1 day)

---

### 10. No Pagination Limits on Public Search RPC
**File:** `supabase/migrations/20250101000005_rpcs.sql` (Lines 14-16, 86)
**Severity:** 🟡 MEDIUM
**Risk:** DoS via memory exhaustion

**Fix:**
```sql
-- ✅ Enforce maximum limit
CREATE OR REPLACE FUNCTION get_products_filtered(
  p_category_slug TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  -- ... other parameters
) RETURNS TABLE (...) AS $$
BEGIN
  -- Enforce max limit of 100
  p_limit := LEAST(p_limit, 100);
  
  -- Rest of function...
END;
$$ LANGUAGE plpgsql;
```

**Timeline:** Fix before launch (1 day)

---

### 11. Seller Status Not Checked in Middleware
**File:** `apps/seller/middleware.ts` (Lines 46-53)
**Severity:** 🟡 MEDIUM
**Risk:** Suspended/pending sellers can access dashboard

**Fix:**
```typescript
// ✅ Verify seller is approved
const { data: seller } = await supabase
  .from("sellers")
  .select("id, status")
  .eq("user_id", user.id)
  .single();

if (!seller || seller.status !== "approved") {
  if (seller?.status === "pending") {
    return NextResponse.redirect(new URL("/seller-registration-pending", request.url));
  } else if (seller?.status === "suspended") {
    return NextResponse.redirect(new URL("/seller-suspended", request.url));
  }
  return NextResponse.redirect(new URL("/seller-login", request.url));
}
```

**Timeline:** Fix before launch (1 day)

---

### 12. Missing Razorpay Webhook Signature Verification
**File:** Webhook handler (create if missing)
**Severity:** 🟡 MEDIUM
**Risk:** Forged payment confirmations, fraud

**Fix:**
```typescript
// Create: apps/web/app/api/webhooks/razorpay/route.ts
import { createHmac } from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  
  // Verify webhook signature
  const expectedSignature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  const event = JSON.parse(body);

  // Handle payment events
  switch (event.event) {
    case "payment.authorized":
      // Update order status
      break;
    case "payment.failed":
      // Handle failed payment
      break;
    case "settlement.processed":
      // Update settlement status
      break;
  }

  return NextResponse.json({ status: "ok" });
}
```

**Timeline:** Fix before launch (1-2 days) - IF webhooks are used

---

## 🟢 LOW SEVERITY (Nice to Have)

### 13-22. Low Severity Issues
Additional findings include:
- Missing strict CSP headers
- Email address accessible in profiles (if RLS bypassed)
- No tenant isolation at application level
- Debug logging in production
- No encryption for bank account details
- Missing X-Frame-Options header
- Razorpay credentials visibility in running process
- Missing .env file validation at startup
- Package vulnerability audit
- Dependency update schedule

**Timeline:** Fix within 1-2 weeks after launch

---

## Summary Table

| Severity | Count | Timeline |
|----------|-------|----------|
| 🔴 Critical | 3 | **Today** |
| 🟠 High | 6 | **Before Launch** |
| 🟡 Medium | 5 | **Before Launch** |
| 🟢 Low | 6 | **Post-Launch** |
| **TOTAL** | **20** | — |

---

## Remediation Priority

### Phase 1: Critical (TODAY - Do Not Skip)
1. ✅ Fix dispatch endpoint authorization
2. ✅ Add RLS policies to product-images bucket
3. ✅ Redact error logs

**Estimated Time:** 3-4 hours

### Phase 2: High Priority (1-2 Days)
4. ✅ Implement rate limiting on payment APIs
5. ✅ Add settlement amount validation
6. ✅ Verify seller ownership on order creation
7. ✅ Add CSRF protection to API routes
8. ✅ Secure Razorpay account credentials

**Estimated Time:** 4-6 hours total

### Phase 3: Medium Priority (1-2 Days)
9. ✅ Add file signature validation
10. ✅ Add pagination limits to RPC
11. ✅ Check seller status in middleware
12. ✅ Add Razorpay webhook signature verification

**Estimated Time:** 3-4 hours total

### Phase 4: Low Priority (Post-Launch)
13-22. Various improvements and hardening

---

## Testing Checklist

After fixes, verify:
- [ ] Dispatch endpoint rejects requests from unauthorized sellers
- [ ] Storage bucket rejects cross-seller file operations
- [ ] Rate limits block excessive requests
- [ ] Settlement validation returns proper errors
- [ ] Order creation fails for invalid sellers
- [ ] CSRF protection blocks cross-origin requests
- [ ] Logs don't contain sensitive data
- [ ] File uploads validate magic bytes
- [ ] Pagination requests are capped at 100
- [ ] Seller middleware checks status
- [ ] Webhook signatures are verified

---

## Sign-off Checklist

- [ ] All 3 critical issues fixed
- [ ] All 6 high issues fixed
- [ ] All 5 medium issues fixed
- [ ] Tests pass for all fixes
- [ ] No new console.error() calls expose sensitive data
- [ ] RLS policies verified by security team
- [ ] Razorpay integration uses webhook signatures
- [ ] Rate limiting tested under load

---

**Status:** Security findings documented. Ready for remediation.

**Next:** Apply fixes in order of severity. Do NOT deploy until all critical and high-priority items are resolved.
