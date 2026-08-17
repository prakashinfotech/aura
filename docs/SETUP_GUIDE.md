# Aura Marketplace — Local Development Setup Guide

Complete guide to set up Aura Marketplace for local development.

---

## Prerequisites Verification

### Node.js & pnpm

```bash
# Check Node.js version (should be ≥18.17.0)
node --version

# Check pnpm version (should be ≥9.0.0)
pnpm --version

# If pnpm not installed, install globally
npm install -g pnpm@9
```

### Git

```bash
git --version
```

---

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/aura-marketplace.git
cd aura-marketplace
```

---

## Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will:
# - Install root dependencies
# - Link @aura/* packages via pnpm workspaces
# - Install app + package dependencies
# - Create pnpm-lock.yaml
```

**Expected output:**
```
Scope: all 7 workspace projects
Progress: resolved 568, reused 494, added 0
Done in 2.4s
```

---

## Step 3: Set Up Environment Variables

### Root `.env.local`
```bash
cp .env.example .env.local
```

Edit `/.env.local`:
```env
# Only Supabase keys needed at root (optional for seeding)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Buyer App `.env.local`
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Razorpay (use test keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMS (optional)
MSG91_AUTH_KEY=xxxxx
MSG91_OTP_TEMPLATE_ID=xxxxx

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Seller App `.env.local`
```bash
cp apps/seller/.env.example apps/seller/.env.local
```

Edit `apps/seller/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## Step 4: Database Setup

### 4a. Create Supabase Project

1. Go to https://app.supabase.com
2. Create new project (or use existing)
3. Copy project URL and API keys
4. Paste into `.env.local` files

### 4b. Run Migrations

All SQL migration files are in `supabase/migrations/`. Apply them in order via Supabase dashboard:

1. Open Supabase dashboard → SQL Editor
2. For each migration file (in order):
   - Copy contents
   - Paste in SQL Editor
   - Run (watch for errors)

**Migration Order:**
1. `00_init_extensions.sql` — Enable pg_cron, pg_trgm
2. `01_auth_profiles.sql` — User profiles
3. `02_categories_brands.sql` — Catalog structure
4. `03_products_variants.sql` — Product master data
5. `04_images_banners.sql` — Assets
6. `05_orders_payments.sql` — Commerce
7. `06_sellers_settlements.sql` — Seller financials
8. `07_reviews_ratings.sql` — User-generated content
9. `08_rpc_functions.sql` — Stored procedures
10. `09_realtime_policies.sql` — Realtime subscriptions

### 4c. Seed Data

```bash
# Seed brands, categories, coupons, banners
psql postgresql://postgres:password@localhost:5432/postgres < supabase/seed_master.sql

# Or if using Supabase hosted:
# 1. Copy supabase/seed_master.sql contents
# 2. Paste in Supabase SQL Editor
# 3. Run

# Seed sellers, products, variants, images
node scripts/seed.mjs

# Expected output:
# Connected to Supabase ✓
# Seeding categories…
#   ✓ 10 categories
# Seeding brands…
#   ✓ 20 brands
# ...
# ✓ Seed complete!
```

---

## Step 5: Verify Setup

### Type Check

```bash
pnpm turbo run type-check

# Expected output:
# ✅ @aura/config: Pass
# ✅ @aura/db: Pass
# ✅ @aura/ui: Pass
# ✅ @aura/validators: Pass
# web app: Some pre-existing errors (DB schema)
# seller app: Some pre-existing errors (DB schema)
```

### Lint Check

```bash
pnpm turbo run lint

# Expected: Passes (or fix linting errors)
```

---

## Step 6: Run Development Servers

### Terminal 1: Buyer App (Port 3000)

```bash
pnpm dev:web
# or: pnpm --filter=web dev

# Expected output:
# ▲ Next.js 15.3.2
# - Local:        http://localhost:3000
# - Environments: .env.local
```

### Terminal 2: Seller App (Port 3001)

```bash
pnpm dev:seller
# or: pnpm --filter=seller dev

# Expected output:
# ▲ Next.js 15.3.2
# - Local:        http://localhost:3001
# - Environments: .env.local
```

### Or Both in Parallel

```bash
pnpm dev
# Runs both apps + watches for changes
```

---

## Step 7: Test the Apps

### Buyer App (http://localhost:3000)

1. **Homepage**: See hero banners, featured products
2. **Browse**: Click category → browse products with filters
3. **Product Detail**: Click product → see images, reviews, variants
4. **Cart**: Add to cart → see in cart drawer
5. **Checkout**: Click checkout → see order form (test with Razorpay test card)

### Seller App (http://localhost:3001)

1. **Login**: Sign in with your seller account email
2. **Dashboard**: See analytics summary
3. **Products**: View your products
4. **Orders**: See orders (if any placed)
5. **Settlements**: Request settlement

---

## Testing & Authentication

### Buyer App
- Create a new account with any email
- Check your email for magic link (check terminal for local dev links)

### Seller App
- Contact admin for seller account credentials
- Use magic link authentication sent to your email

### Razorpay Test Card
For testing payments in development environment only:
- **Card Number**: `4111111111111111`
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)
- **OTP**: `000000` (any 6 digits)

---

## Development Workflow

### Edit Code

```bash
# Edit any .tsx, .ts, .jsx, .js file
# Server auto-restarts on save via Turbopack
```

### Type Check

```bash
# After making changes:
pnpm turbo run type-check

# Or watch mode (if supported):
pnpm turbo run type-check -- --watch
```

### Lint

```bash
pnpm turbo run lint

# Auto-fix linting errors:
pnpm turbo run lint -- --fix
```

### Test

```bash
# Run all tests:
pnpm turbo run test

# Watch mode:
pnpm turbo run test -- --watch

# Single package:
pnpm --filter=@aura/ui run test
```

---

## Common Tasks

### Add New Page to Buyer App

```bash
# Create file:
touch apps/web/app/my-page/page.tsx

# Edit apps/web/app/my-page/page.tsx:
export default function MyPage() {
  return <div>Hello</div>
}

# Visit: http://localhost:3000/my-page
```

### Add New Component to Shared UI

```bash
# Create component:
touch packages/ui/src/components/my-component.tsx

# Edit packages/ui/src/components/my-component.tsx:
export function MyComponent() {
  return <div>Component</div>
}

# Add to exports:
# packages/ui/src/index.ts:
export { MyComponent } from './components/my-component'

# Use in apps:
import { MyComponent } from '@aura/ui'
```

### Update Database

After schema changes:

```bash
# 1. Create migration file:
# supabase/migrations/NN_description.sql

# 2. Run migration in Supabase SQL Editor

# 3. Regenerate types:
supabase gen types typescript --local > packages/db/src/types.ts

# 4. Type-check:
pnpm turbo run type-check
```

### Add New Validation Schema

```bash
# Create schema:
touch packages/validators/src/my-validator.ts

# Edit packages/validators/src/my-validator.ts:
import { z } from 'zod'
export const mySchema = z.object({
  name: z.string().min(1),
})

# Export from index:
# packages/validators/src/index.ts:
export * from './my-validator'

# Use:
import { mySchema } from '@aura/validators'
const result = mySchema.parse(data)
```

---

## Debugging

### Next.js Debugging

```bash
# Chrome DevTools inspection:
NODE_OPTIONS='--inspect-brk' pnpm --filter=web dev

# Then open: chrome://inspect
```

### Database Queries

```bash
# View query logs in Supabase dashboard:
# Supabase Dashboard → Logs → Database → Queries
```

### Supabase Auth Issues

```bash
# Check auth logs in Supabase:
# Supabase Dashboard → Logs → Authentication
```

### Razorpay Webhook Issues

```bash
# Test webhook locally with ngrok:
npm install -g ngrok

# In one terminal:
pnpm dev

# In another:
ngrok http 3000

# Set webhook URL in Razorpay dashboard:
# https://<ngrok-id>.ngrok.io/api/orders/verify

# Test payment:
# App will receive webhook at http://localhost:3000/api/orders/verify
```

---

## Troubleshooting

### "Cannot find module '@aura/ui'"

**Solution:**
```bash
# Reinstall:
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Supabase connection refused"

**Causes:**
- Invalid URL or API keys
- Firewall/VPN blocking connection
- Supabase project not active

**Solution:**
```bash
# 1. Verify credentials:
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. Check project is active in Supabase dashboard

# 3. Temporarily allow all IPs (for local dev):
# Supabase → Project Settings → Network → IP Whitelist
```

### "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000:
lsof -ti:3000 | xargs kill -9

# Or use different port:
pnpm --filter=web dev -- -p 3005
```

### TypeScript errors after pulling new code

**Solution:**
```bash
# Regenerate types from Supabase:
supabase gen types typescript --local > packages/db/src/types.ts

# Reinstall if package.json changed:
pnpm install

# Type-check:
pnpm turbo run type-check
```

### Tailwind CSS not applying

**Solution:**
```bash
# Rebuild Tailwind:
pnpm turbo run clean
pnpm install

# Check tailwind.config.ts exists in apps/web and apps/seller
```

### Razorpay test mode not working

**Solution:**
```bash
# Use test keys (start with rzp_test_):
echo $RAZORPAY_KEY_ID

# Test card (not real):
# 4111111111111111 | 12/25 | 123 | 000000

# Dashboard payment: https://dashboard.razorpay.com/
# (Only visible if using live keys for actual transactions)
```

---

## Useful Commands Cheatsheet

```bash
# Install/Clean
pnpm install                                 # Install all deps
pnpm turbo run clean && pnpm install        # Full clean + reinstall

# Development
pnpm dev                                     # Run both apps
pnpm dev:web                                # Buyer app only
pnpm dev:seller                             # Seller app only

# Quality
pnpm turbo run type-check                   # Type-check all
pnpm turbo run lint                         # Lint all
pnpm turbo run test                         # Test all

# Building
pnpm turbo run build                        # Build all
pnpm turbo run build --filter=web           # Build buyer only

# Specific package
pnpm --filter=@aura/ui run build            # Build UI package
pnpm --filter=web dev                       # Run buyer app

# Database
supabase gen types typescript --local > packages/db/src/types.ts  # Regenerate DB types
```

---

## Next Steps

1. ✅ Setup complete!
2. Explore `README.md` for feature overview
3. Check `docs/ARCHITECTURE.md` for system design
4. Read `CLAUDE.md` for development guidelines
5. Start building! 🚀

---

## Getting Help

- **Errors?** Check terminal output for stack trace
- **Stuck?** Read docs/ folder
- **Questions?** Open GitHub issue
- **Bug report?** Include: Node version, error message, steps to reproduce

Happy coding! 🎉
