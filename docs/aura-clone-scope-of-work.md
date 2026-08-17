# Aura Marketplace — Scope of Work & Technical Requirements

**Project:** Fashion E-Commerce Marketplace (Aura)
**Version:** 1.0.0.0
**Reference:** Generic fashion e-commerce marketplace architecture
**Phases:** Phase 1 — Buyer & Seller | Phase 2 — Admin

---

# SECTION 1 — TECHNICAL ARCHITECTURE

## 1.1 Technology Stack

| Layer | Technology | Version / Detail |
|---|---|---|
| Frontend Framework | React | 19 (with React Compiler) |
| Meta-Framework | Next.js | 15 (App Router, RSC, SSR/ISR) |
| Language | TypeScript | 5.x — strict mode, no `any` |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | (Radix UI primitives) |
| State Management | Zustand | Client-side global state |
| Server State / Cache | TanStack Query | v5 |
| Forms | React Hook Form + Zod | Schema-validated forms |
| Database | Supabase (PostgreSQL 15) | Hosted on Supabase Cloud |
| Auth | Supabase Auth | JWT, OAuth, OTP |
| File Storage | Supabase Storage | S3-compatible, CDN-backed |
| Realtime | Supabase Realtime | WebSocket subscriptions |
| Background Jobs | Supabase Edge Functions + pg_cron | Deno runtime |
| Payment Gateway | Razorpay | Orders API + Payouts API + Webhooks |
| SMS Provider | MSG91 | OTP delivery |
| Email Provider | Resend | Transactional emails |
| Search | PostgreSQL FTS (pg_trgm + tsvector) | Phase 1; Typesense optional Phase 2 |
| Deployment | Vercel | Pro plan (Edge Network, Serverless) |
| Version Control | GitHub | Monorepo |
| CI/CD | GitHub Actions + Vercel | Automated pipeline |
| Analytics | Vercel Analytics + custom events | |
| Error Monitoring | Sentry | Frontend + Edge Functions |
| Logging | Supabase Logs + Axiom | Query and function logs |

## 1.2 Repository Structure

```
aura-marketplace/
├── apps/
│   ├── web/                           # Buyer-facing Next.js app (Vercel)
│   └── seller/                        # Seller portal Next.js app (Vercel)
├── packages/
│   ├── ui/                            # Shared shadcn/ui component library
│   ├── db/                            # Supabase client, types, RPC wrappers
│   ├── validators/                    # Shared Zod schemas
│   └── config/                        # Shared ESLint, TS, Tailwind configs
├── supabase/
│   ├── migrations/                    # Versioned SQL migrations
│   ├── functions/                     # Edge Functions (Deno)
│   └── seed/                          # Seed data
├── .github/
│   └── workflows/                     # CI/CD pipeline YAMLs
├── package.json                       # pnpm workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## 1.3 Application Architecture

### Three Distinct Apps

| App | URL Pattern | Audience | Rendering |
|---|---|---|---|
| `apps/web` | `www.yourdomain.com` | Buyers | SSR + ISR (PDP/PLP cached) + CSR (cart, checkout) |
| `apps/seller` | `seller.yourdomain.com` | Sellers | CSR (authenticated dashboard) |
| Admin Portal | `admin.yourdomain.com` | Admins | CSR (Phase 2, behind role guard) |

### Next.js App Router Layout (apps/web)

```
app/
├── (public)/
│   ├── page.tsx                       # Homepage (ISR, revalidate: 300s)
│   ├── category/[slug]/page.tsx       # PLP (ISR, revalidate: 60s)
│   ├── product/[slug]/page.tsx        # PDP (ISR, revalidate: 30s)
│   ├── brand/[slug]/page.tsx          # Brand PLP
│   └── search/page.tsx               # Search results (CSR)
├── (auth)/
│   ├── account/
│   ├── checkout/
│   ├── wishlist/
│   └── orders/[id]/
├── (marketing)/
│   └── insider/
└── api/
    ├── webhooks/
    │   ├── razorpay/route.ts
    │   └── logistics/route.ts
    ├── events/
    │   └── impression/route.ts
    └── revalidate/route.ts
```

### Rendering Strategy

| Page | Strategy | Revalidation |
|---|---|---|
| Homepage | ISR | 300s |
| PLP (category) | ISR | 60s |
| PDP | ISR | 30s |
| Search results | CSR | — |
| Cart / Checkout | CSR | — |
| Account pages | CSR | — |
| Seller dashboard | CSR | — |

### Supabase Edge Functions

```
send-email              # Resend integration
send-sms                # MSG91 integration
razorpay-webhook        # Payment events
logistics-webhook       # Courier tracking events
generate-invoice        # PDF invoice generation
generate-settlement     # Settlement calculation
process-refund          # Razorpay refund trigger
award-insider-points    # Loyalty points engine
bulk-product-import     # CSV/XLSX processing
revalidate-pages        # ISR cache invalidation
```

## 1.4 Database Design Principles

- UUID v4 primary keys on all tables (`gen_random_uuid()`)
- `created_at` / `updated_at` on every table — `updated_at` auto-managed via trigger
- Soft deletes on users, products, sellers — `deleted_at timestamptz`; RLS filters `WHERE deleted_at IS NULL`
- RLS on every table — default deny; explicit policies per role
- No raw secrets in DB — payment tokens stored via Razorpay vault
- Migrations — every schema change via numbered SQL file; never manual edits to production
- Generated types — `supabase gen types typescript` run in CI; output committed to `packages/db/types.ts`

## 1.5 CI/CD Pipeline

### Branch Strategy

```
main       →→→ Production (auto-deploy to Vercel prod + Supabase prod)
staging    →→→ Staging (auto-deploy to Vercel preview + Supabase staging)
develop    →→→ Integration branch
feature/*  →→→ PR → develop
hotfix/*   →→→ PR → main + develop
```

**Versioning:** `MAJOR.MINOR.PATCH.BUILD` starting at `1.0.0.0`

### GitHub Actions Workflows

#### ci.yml — Pull Request Checks
Jobs (parallel): lint, type-check, test, build, db-types (drift check), migration-lint, lighthouse

#### deploy-staging.yml
Jobs (sequential): ci → db-migrate → deploy-web → deploy-seller → smoke-test → notify

#### deploy-production.yml
Jobs (sequential): ci → version-bump → db-migrate → deploy-web → deploy-seller → isr-revalidate → smoke-test → github-release → notify

## 1.6 Security Architecture

- JWT in `httpOnly` cookie (never `localStorage`)
- Session: 30-day rolling for buyers; 8h max for sellers/admins
- Admin 2FA: TOTP mandatory
- Razorpay webhook: `X-Razorpay-Signature` HMAC-SHA256 verification
- Rate limiting: OTP 3/15min, login 5/15min, product upload 100/hour/seller
- PII masking: buyer name/email/phone never sent to seller
- RLS default deny on all tables

### Content Security Policy
```
default-src 'self';
script-src 'self' 'nonce-{nonce}' https://checkout.razorpay.com;
img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com;
```

## 1.7 Performance Budgets

| Metric | Target |
|---|---|
| LCP (Mobile) | < 2.5s P75 |
| CLS | < 0.1 |
| INP | < 200ms |
| TTFB (ISR pages) | < 200ms |
| Supabase RPC P95 | < 300ms |
| Lighthouse Performance | > 80 |

## 1.8 Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pricing, coupon, settlement logic, RLS policies |
| Component | React Testing Library + Vitest | All `packages/ui` components |
| Integration | Vitest + Supabase local | Edge Functions, RPCs, auth flows |
| E2E — Buyer | Playwright | Register → Browse → Cart → Checkout → Track → Return |
| E2E — Seller | Playwright | Register → Create product → Dispatch → Settlement |
| Accessibility | axe-core via Playwright | All major buyer-facing pages |
| Performance | Lighthouse CI in GitHub Actions | Per PR budget enforcement |

## 1.9 Third-Party Integrations

| Integration | Provider | Purpose |
|---|---|---|
| Payment processing | Razorpay Orders API | UPI, card, netbanking, EMI, wallets, COD |
| Seller payouts | Razorpay Payouts API | D+15 settlement bank transfers |
| Payment refunds | Razorpay Refunds API | Cancellation and return refunds |
| SMS / OTP | MSG91 | OTP delivery, order notifications |
| Email | Resend | All transactional emails |
| Pincode lookup | postalpincode.in | Address auto-fill |
| Logistics | Delhivery or Shiprocket | AWB generation, tracking, returns pickup |
| Voice search | Web Speech API (browser native) | Voice-to-text in search bar |

---

# SECTION 2 — FUNCTIONAL REQUIREMENTS

## PHASE 1 — BUYER MODULE

### EPIC B-1: Authentication & Account Management
- **US-B-1.1** Registration: mobile OTP, email+password, Google OAuth, Facebook OAuth
- **US-B-1.2** Login: OTP, email+password, "Keep me signed in", account lockout after 5 failed attempts
- **US-B-1.3** Profile: name, gender, DOB, avatar upload (react-easy-crop, 1:1 crop, 5MB)
- **US-B-1.4** Address book: up to 10 addresses, pincode auto-fill, default address trigger

### EPIC B-2: Product Discovery & Browse
- **US-B-2.1** Homepage: hero carousel (Embla), category links, Trending Now, Deals of the Day with countdown, personalized recommendations
- **US-B-2.2** Category navigation: mega-menu (desktop), category drawer (mobile), breadcrumbs
- **US-B-2.3** PLP: 2-col mobile / 4-col desktop, sort (7 options), filters (brand, price, discount, size, color, rating, occasion, gender) — all URL-synced, infinite scroll (mobile) / pagination (desktop)
- **US-B-2.4** PDP: image gallery + zoom, color/size selectors, size guide modal, pincode delivery check, accordion details, seller info, reviews, similar products
- **US-B-2.5** Search: autocomplete 300ms debounce, voice search (Web Speech API), trigram + FTS backend, recent searches

### EPIC B-3: Wishlist & Cart
- **US-B-3.1** Wishlist: heart toggle, guest localStorage merge on login, shareable URL (nanoid slug), out-of-stock alerts, price drop notifications
- **US-B-3.2** Cart: persist DB (logged in) / localStorage (guest), qty cap at stock, drawer (desktop) / full page (mobile), delivery charge calculation

### EPIC B-4: Reviews & Ratings
- **US-B-4.1** Reviews: delivered buyers only (one per order item), 1–5 stars, title + body, up to 5 photos, helpful votes, 7-day edit window enforced by RLS

### EPIC B-5: Checkout & Payments
- **US-B-5.1** Checkout: 3 steps (address → summary → payment), order confirmation page, confirmation email + SMS
- **US-B-5.2** Coupons: flat, percent, free delivery, category/brand/first-order/bank types; auto-apply best offer; server-side validation only
- **US-B-5.3** Payment: UPI, card (saved via Razorpay tokenization), netbanking, COD, EMI, wallets; webhook handler with HMAC-SHA256 verification
- **US-B-5.4** Credits: earn from refunds/promotions, 1-year expiry, max 10% per order redemption
- **US-B-5.5** Gift cards: 16-char code, partial redemption, no expiry, balance check page

### EPIC B-6: Order Management
- **US-B-6.1** Tracking: visual status timeline, logistics webhook updates, invoice download (signed URL, 15-min expiry)
- **US-B-6.2** Cancellation: pre-ship only, Razorpay refund to original method, stock restocked atomically
- **US-B-6.3** Returns: 30-day window, photo evidence for defective, exchange option, refund to original or Credits (+5% bonus)

### EPIC B-7: Insider Loyalty
Tiers: Insider → Select (₹3K) → Elite (₹12K) → Icon (₹30K) based on 12-month rolling spend. SuperCoins: 1 per ₹10 spent, +50 for review, 1-year expiry.

### EPIC B-8: Notifications
Types: order updates, price drop, back-in-stock, offers, insider tier change. Per-type preferences. Web push via service worker.

---

## PHASE 1 — SELLER MODULE

### EPIC S-1: Seller Onboarding
- 7-step registration: business info → GSTIN/PAN → contact → warehouse address → documents → bank → declaration
- Status: Submitted → Documents Under Review → Brand Verification → Active / Rejected
- GSTIN format validation (15-char checksum), IFSC via Razorpay API, Razorpay penny drop bank verification

### EPIC S-2: Product Catalog Management
- 5-step wizard: category/attributes → rich text description (Tiptap) → variant matrix (color rows × size columns) → images → review
- Auto-save draft every 30s to `product_drafts` table
- Bulk upload: XLSX template + ZIP images, Edge Function processing, error report
- Inline stock/price editing, bulk actions, deactivate (no delete if orders exist)
- Low stock alerts: threshold per variant, DB trigger on qty update

### EPIC S-3: Order Fulfillment
- Tabs: New / Ready to Ship / Shipped / Delivered / Cancelled / Returns
- Dispatch SLA countdown: green >24h, orange 6–24h, red <6h
- Delhivery/Shiprocket: AWB creation, label fetch, tracking webhook
- Packing slip and bulk label PDF generation

### EPIC S-4: Seller Financials
- D+15 settlement cycle, Mon/Wed/Fri payouts via Razorpay Payouts API
- Commission by category rate, TDS (1%), TCS (1%)
- Downloadable XLSX reports: Order Detail, Sales Revenue, GST/TCS, Settlement, Returns/Refunds

### EPIC S-5: Analytics & Marketing
- Metrics: Impressions, Clicks, CTR, Add-to-Cart Rate, Conversion, Return Rate, AOV
- Recharts: LineChart, BarChart, PieChart
- Seller promotions: discount %, flash sales (>50% requires admin approval), Minis videos (MP4, 100MB)
- CPC search boosts: bid in `search_boosts` table influences `search_products` RPC ranking

### EPIC S-6: Account Settings
- Team roles: Manager, Operations, Finance, Viewer
- Invite via signed JWT email (48h expiry)
- GST changes require document resubmission and admin re-review
- All mutations logged in `seller_activity_log`

---

## PHASE 2 — ADMIN MODULE

### EPIC A-1: Admin Auth
- Email + password + mandatory TOTP 2FA
- Roles: Super Admin, Catalog Manager, Seller Manager, Finance Manager, Content Manager, Support Agent
- 8-hour session timeout, all actions in `admin_audit_log`

### EPIC A-2: Seller Management
- Application queue with SLA indicator (>7 days orange, >15 days red)
- GSTIN auto-verify via GSTN API, document viewer (private bucket signed URLs)
- Health score: on-time dispatch, return rate, cancellation rate, buyer rating
- Auto-flag thresholds: return rate >20%, dispatch rate <85%, defect rate >2%, cancellation >5%
- Actions: Warning, Temporary Suspend (7/15/30 days), Permanent Delist, Return Override

### EPIC A-3: Product Catalog QC
- QC queue: PDP preview + raw field data split view
- Image auto-check: width <800px or low sharpness → flag
- Per-field feedback stored in `product_qc_feedback`
- Category tree editor with dnd-kit drag-and-drop

### EPIC A-4: Order & Dispute Management
- Global order search (FTS on order ID + buyer email + product title)
- Force Cancel, Force Refund, Manual Tracking Update
- Returns queue: override seller rejection, reject fraudulent returns
- Fraud flag: buyers with >5 returns in 30 days (pg_cron daily check)

### EPIC A-5: Financial Management
- Settlement processing: pg_cron Mon/Wed/Fri 06:00 IST + manual trigger
- Razorpay Payouts API integration, failed payout flagging + retry
- Commission rate CRUD with `effective_from` (no retroactive changes)
- Coupon CRUD with user segment restrictions (new users, insider tier, buyer list)

### EPIC A-6: Content & Merchandising
- Banner CRUD, homepage section reorder (dnd-kit)
- Preview mode (bypass ISR cache)
- Sale event management: teaser dates, early access per insider tier, seller invitation + submission + review
- On publish: `revalidateTag('homepage')` + `revalidateTag('plp')`

### EPIC A-7: Business Intelligence
- Real-time: live orders/min (Supabase Realtime), active sessions (browse_events last 5min)
- Materialized views: `mv_daily_gmv`, `mv_category_orders`, `mv_seller_gmv` (refresh hourly)
- Cohort analysis, geographic orders by state, top 10 products/sellers/brands
- Export: Edge Function → SheetJS XLSX or puppeteer PDF → signed URL

---

# SECTION 3 — SHARED CONCERNS

## 3.1 RLS Policy Summary

| Table Group | Buyer | Seller | Admin |
|---|---|---|---|
| profiles, addresses | Own rows | — | Service role |
| products, images | Read active | Own seller_id | Full service role |
| cart_items, wishlists | Own user_id | — | — |
| orders, order_items | Own user_id | Own seller_id (limited cols) | Full service role |
| reviews | Read all; write own (delivered) | Read own product reviews | Full service role |
| sellers | — | Own id row | Full service role |

## 3.2 Supabase Storage Buckets

| Bucket | Public Read | Max Size | Format |
|---|---|---|---|
| `product-images` | Yes | 5MB | JPG, PNG |
| `seller-docs` | No | 10MB | PDF, JPG, PNG |
| `review-photos` | Yes | 5MB | JPG, PNG |
| `avatars` | Yes | 5MB | JPG, PNG |
| `minis` | Yes | 100MB | MP4 |
| `invoices` | No | Generated | PDF |
| `banners` | Yes | 5MB | JPG, PNG |
| `exports` | No | Generated | XLSX, PDF |

## 3.3 Scheduled Jobs (pg_cron)

| Job | Schedule (IST) | Action |
|---|---|---|
| `expire-credits` | Daily 02:00 | Expire credits_ledger past expires_at |
| `expire-insider-points` | Daily 02:30 | Expire insider points |
| `cleanup-deleted-users` | Daily 03:30 | Anonymize PII for deleted_at < now() - 30 days |
| `recalculate-insider-tiers` | 1st of month 03:00 | Recalculate all tiers; send tier-change emails |
| `seller-health-scores` | Daily 04:00 | Refresh seller_health_scores materialized view |
| `seller-flag-check` | Daily 04:30 | Check health thresholds; insert seller_flags |
| `fraud-flag-check` | Daily 05:00 | Flag buyers with >5 returns in last 30 days |
| `generate-settlements` | Mon/Wed/Fri 06:00 | Settlement calculation |
| `refresh-bi-views` | Hourly | Refresh BI materialized views |
| `price-drop-check` | Daily 09:00 | Compare wishlist prices; trigger notifications |
| `low-stock-alerts` | Hourly | Check variants below threshold |
| `expire-coupons` | Daily 00:05 | Deactivate expired coupons |

## 3.4 Accessibility (WCAG 2.1 AA)
- All interactive elements keyboard navigable (Tab, Enter, Escape, Arrow keys)
- ARIA roles on icon-only buttons, modals, dropdowns, carousels
- Color contrast ≥ 4.5:1 for normal text
- Form errors via `aria-describedby` + `role="alert"` for dynamic errors
- axe-core in Playwright E2E in CI

## 3.5 SEO (Buyer App)
- `generateMetadata()` on all public pages (title, description, canonical, OG, Twitter cards)
- PDP: `Product` JSON-LD (name, image, offers.price, availability, aggregateRating)
- Breadcrumb: `BreadcrumbList` JSON-LD on category + PDP pages
- Dynamic sitemap: `/api/sitemap` → paginated XML for all active products/categories/brands
- `robots.txt`: disallow `/checkout`, `/account`, `/api`, `/seller`, `/admin`

## 3.6 Internationalization (Phase 1)
- Language: English only
- Currency: INR via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
- Timezone: IST (Asia/Kolkata) for all dates and pg_cron schedules
- Date format: DD MMM YYYY via `date-fns` `'dd MMM yyyy'`

## 3.7 Error Handling Standards
- Supabase RPC errors: `{ success: false, error_code: string, message: string }` — never raw PostgreSQL errors
- Client errors: TanStack Query `onError` → Sonner toast (5s auto-dismiss)
- Payment errors: Razorpay error code → mapped user-friendly message
- HTTP 404: `not-found.tsx` with search bar + category links
- HTTP 500: `error.tsx` per route segment with retry button + Sentry event ID

## 3.8 Version Control Standards
- Commit convention: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)
- PR requirements: 1 approval for `develop`; 2 approvals for `staging`/`main`; no self-merges on `main`
- Changelog: auto-generated from Conventional Commits by `changelogithub` on each release
- Branch protection: `main` and `staging` require PR, CI pass, no force push

---

*Version 1.0.0.0 | Phase 1: Buyer + Seller | Phase 2: Admin*
*React 19 · Next.js 15 · TypeScript · Supabase · Razorpay · Vercel · GitHub Actions · pnpm · Turborepo*
