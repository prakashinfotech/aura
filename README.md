# Aura Marketplace

A full-stack fashion e-commerce platform built with modern web technologies. Features include a buyer-facing storefront, seller portal, product catalog management, shopping cart, checkout with Razorpay payments, and order fulfillment.

**Status**: Production-ready monorepo with TypeScript strict mode, Tailwind CSS 4, and Supabase backend.

---

## 🏗️ Architecture Overview

```
Aura Marketplace (pnpm + Turborepo)
├── apps/
│   ├── web/                    # Buyer-facing app (Next.js 15, SSR/ISR)
│   │   ├── app/                # App Router pages & API routes
│   │   ├── components/         # Page-specific components
│   │   ├── lib/                # Utilities, hooks, queries
│   │   ├── stores/             # Zustand stores (cart, wishlist, auth)
│   │   └── hooks/              # Custom hooks (useAuth, etc.)
│   │
│   └── seller/                 # Seller portal (Next.js 15, CSR)
│       ├── app/                # Dashboard pages
│       ├── components/         # Portal components
│       ├── lib/                # Seller utilities
│       └── api/                # Settlement, dispatch, product APIs
│
├── packages/
│   ├── ui/                     # Shared component library
│   │   ├── src/components/     # shadcn/ui + custom components
│   │   └── src/tokens.css      # Design tokens (colors, radius, shadows)
│   │
│   ├── db/                     # Database client & types
│   │   ├── src/client.ts       # Browser Supabase client
│   │   ├── src/server.ts       # Server Supabase client
│   │   └── src/types.ts        # Generated PostgreSQL types
│   │
│   ├── validators/             # Zod schemas
│   │   └── src/                # Auth, address, product, order validators
│   │
│   └── config/                 # Shared configs
│       ├── tsconfig.base.json  # TypeScript base config
│       └── eslint.base.mjs     # ESLint rules
│
├── supabase/
│   ├── migrations/             # Versioned SQL migrations
│   └── seed_master.sql         # Master seed (brands, categories, coupons)
│
├── scripts/
│   └── seed.mjs                # Seed sellers, products, variants, images
│
├── docs/
│   ├── aura-marketplace-requirements.md  # Full requirements
│   └── CLAUDE_CODE_PROMPT.md          # Build guide
│
└── pnpm-workspace.yaml         # Workspace configuration
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19 (with React Compiler) |
| **Meta-Framework** | Next.js | 15 (App Router, RSC, SSR/ISR) |
| **Language** | TypeScript | 5.x (strict mode) |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | shadcn/ui | Radix UI primitives |
| **State Management** | Zustand | Client-side global state |
| **Server State** | TanStack Query | v5 (React Query) |
| **Forms** | React Hook Form + Zod | Schema validation |
| **Database** | Supabase (PostgreSQL 15) | Cloud-hosted |
| **Authentication** | Supabase Auth | JWT, OAuth, OTP |
| **File Storage** | Supabase Storage | S3-compatible |
| **Real-time** | Supabase Realtime | WebSocket subscriptions |
| **Payments** | Razorpay | Orders, Payouts, Webhooks |
| **Email** | Resend | Transactional emails |
| **SMS** | MSG91 | OTP delivery |
| **Build System** | Turborepo | Monorepo orchestration |
| **Package Manager** | pnpm | 9.x |
| **Deployment** | Vercel | Pro plan (Edge, Serverless) |

---

## 📋 Prerequisites

- **Node.js**: ≥18.17.0 (recommended 20+ for best performance)
- **pnpm**: ≥9.0.0 (install globally: `npm install -g pnpm@9`)
- **Git**: For version control
- **Supabase Account**: Free or paid tier for PostgreSQL database
- **Razorpay Account**: For payment processing (test mode available)

### Optional
- **Docker**: For local PostgreSQL (if not using Supabase)
- **VS Code**: Recommended editor (with ESLint, Prettier extensions)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/aura-marketplace.git
cd aura-marketplace

pnpm install
```

### 2. Environment Variables

Create `.env.local` in the root and in `apps/web/`:

```env
# Supabase (get from dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Razorpay (test keys)
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

### 3. Database Setup

```bash
# Apply all migrations (run in Supabase dashboard SQL editor)
# See: supabase/migrations/ for individual migration scripts

# Seed with brands, categories, coupons, banners
psql postgresql://postgres:password@localhost:5432/postgres < supabase/seed_master.sql

# Seed with sellers, products, variants, images
node scripts/seed.mjs
```

### 4. Run Development Servers

**Buyer App (port 3000)**
```bash
pnpm dev:web
# or: pnpm --filter=web dev
```

**Seller App (port 3001)**
```bash
pnpm dev:seller
# or: pnpm --filter=seller dev
```

**Both in parallel**
```bash
pnpm dev
```

Then open:
- Buyer: http://localhost:3000
- Seller: http://localhost:3001

---

## 🔨 Build Commands

```bash
# Install all dependencies
pnpm install

# Type-check all packages
pnpm turbo run type-check

# Lint all packages
pnpm turbo run lint

# Build all apps + packages
pnpm turbo run build

# Build buyer app only
pnpm turbo run build --filter=web

# Build seller app only
pnpm turbo run build --filter=seller

# Clean all build outputs & node_modules
pnpm turbo run clean
pnpm install  # reinstall after clean
```

---

## 📁 Project Structure

### `apps/web` — Buyer-Facing App

**Key Routes:**
- `/` — Home (hero banners, featured products)
- `/category/[...slug]` — Product listing with filters
- `/product/[slug]` — Product detail page (images, reviews, variants)
- `/search?q=` — Search results
- `/wishlist` — Saved items
- `/checkout` — Cart & payment
- `/account/profile` — User profile
- `/account/orders` — Order history
- `/account/addresses` — Saved addresses

**State Management:**
- `stores/cart-store.ts` — Zustand cart (persisted to localStorage)
- `stores/wishlist-store.ts` — Zustand wishlist
- `stores/auth-store.ts` — Zustand auth (via Supabase)

**API Routes:**
- `app/api/orders/create` — Create order with Razorpay session
- `app/api/orders/verify` — Verify payment & create order in DB
- `app/api/upload/avatar` — Upload user avatar

### `apps/seller` — Seller Portal

**Key Routes:**
- `/` — Redirect to dashboard
- `/login` — Seller login
- `/register` — Seller registration
- `/dashboard` — Analytics overview
- `/dashboard/products` — Product management
- `/dashboard/orders` — Order fulfillment
- `/dashboard/settlements` — Payment settlements

**API Routes:**
- `app/api/dispatch/route.ts` — Mark order as dispatched
- `app/api/settlements/request/route.ts` — Request settlement

### `packages/ui` — Component Library

**Exported Components:**
```typescript
export { Button } from './components/button'
export { Input } from './components/input'
export { Badge } from './components/badge'
export { Dialog, DialogContent, DialogHeader } from './components/dialog'
export { Sheet, SheetContent } from './components/sheet'
export { Skeleton } from './components/skeleton'
export { Toast, Toaster } from './components/toast'
export { ProductCard, ProductCardSkeleton } from './components/product-card'
export { PriceDisplay, formatInr } from './components/price-display'
export { Rating } from './components/rating'
```

**Design Tokens:**
```css
/* Primary (Indigo) */
--brand: #6366f1;
--brand-hover: #4f46e5;
--brand-soft: #f0f4ff;

/* Secondary (Dark Gray) */
--secondary: #1f2937;
--secondary-hover: #111827;

/* Highlight (Amber) */
--highlight: #f59e0b;
--highlight-soft: #fef3c7;

/* Semantic */
--success: #03a685;
--warning: #ff9800;
--error: #f32f2f;
--info: #2874f0;
```

### `packages/db` — Database Client

**Usage:**
```typescript
// Server-side (app router)
import { createServerClient } from '@aura/db/server'
const db = createServerClient()
const products = await db.from('products').select('*')

// Client-side (browser)
import { createClient } from '@aura/db/client'
const db = createClient()
const { data } = await db.from('products').select('*')

// Types (generated from schema)
import type { Database } from '@aura/db/types'
type Product = Database['public']['Tables']['products']['Row']
```

### `packages/validators` — Zod Schemas

```typescript
import { loginSchema, signupSchema } from '@aura/validators/auth'
import { addressSchema } from '@aura/validators/address'
import { productSchema } from '@aura/validators/product'
import { orderSchema } from '@aura/validators/order'
```

---

## 📊 Database Schema (PostgreSQL 15)

**Core Tables:**
- `categories` — Product categories (men, women, kids, etc.)
- `brands` — Brand information
- `products` — Product master data
- `product_variants` — Size, color, SKU, pricing, stock
- `product_images` — Product photos
- `profiles` — User profiles (extended from auth.users)
- `addresses` — Saved delivery addresses
- `coupons` — Discount codes
- `orders` — Customer orders
- `order_items` — Line items per order
- `reviews` — Product reviews & ratings
- `sellers` — Seller store information
- `banners` — Hero & category banners

**Key Relationships:**
- products → categories (many-to-one)
- products → brands (many-to-one)
- product_variants → products (one-to-many)
- product_images → products (one-to-many)
- orders → profiles (many-to-one)
- order_items → orders (one-to-many)
- reviews → products (many-to-one)

Run `supabase gen types typescript --local > packages/db/src/types.ts` after migrations to regenerate types.

---

## 🧪 Testing

```bash
# Run all tests
pnpm turbo run test

# Run tests for specific package
pnpm --filter=@aura/ui run test

# Watch mode
pnpm turbo run test -- --watch
```

**Test Setup:**
- `@testing-library/react` for component tests
- `vitest` for unit tests
- `@playwright/test` for E2E tests (optional)

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   - Push to GitHub
   - Import in Vercel dashboard

2. **Environment Variables:**
   - Add `.env.local` variables to Vercel project settings
   - One `SUPABASE_SERVICE_ROLE_KEY` per environment (dev, staging, prod)

3. **Deploy:**
   ```bash
   # Automatic on push to main
   # Or manual:
   vercel deploy --prod
   ```

4. **Database Migrations:**
   - Apply migrations in Supabase dashboard before deploying UI
   - Order: Extensions → Auth → Tables → RPCs → Policies

### Self-Hosted (Docker)

```dockerfile
# See Dockerfile in root (if provided)
docker build -t aura-marketplace .
docker run -p 3000:3000 -p 3001:3001 aura-marketplace
```

---

## 🔐 Security Checklist

- [ ] Never commit `.env.local` or secrets
- [ ] Use `NEXT_PUBLIC_` prefix only for client-safe variables
- [ ] Enable Row-Level Security (RLS) on all Supabase tables
- [ ] Verify Razorpay webhook signatures (`RAZORPAY_WEBHOOK_SECRET`)
- [ ] Set CORS origins in Supabase (your domain only)
- [ ] Enable HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Use Supabase service role key only on server-side

---

## 📚 Key Files

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Development guidance for Claude Code |
| `docs/aura-marketplace-requirements.md` | Full project requirements & features |
| `docs/CLAUDE_CODE_PROMPT.md` | Build task ordering & implementation guide |
| `supabase/migrations/` | Version-controlled SQL migrations |
| `packages/ui/src/tokens.css` | Global design tokens |
| `apps/web/middleware.ts` | Auth & route protection |
| `apps/web/lib/queries/products.ts` | TanStack Query hooks |
| `scripts/seed.mjs` | Database seeding script |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Follow ESLint rules: `pnpm turbo run lint`
3. Pass type-check: `pnpm turbo run type-check`
4. Commit with clear messages: `git commit -m "feat: add wishlist"`
5. Push and open a PR against `main`

---

## 📖 Learning Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Guide](https://supabase.com/docs)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ❓ Troubleshooting

**"Cannot find module '@aura/ui'"**
- Run `pnpm install` to ensure all packages are linked
- Check `pnpm-lock.yaml` is up to date

**TypeScript errors after rebrand**
- Run `pnpm turbo run type-check` to see all errors
- Some pre-existing schema errors may require DB migrations

**Port 3000/3001 already in use**
- Change port: `pnpm --filter=web dev -- -p 3005`
- Or kill process: `lsof -ti:3000 | xargs kill -9`

**Supabase connection fails**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in `.env.local`
- Check network connectivity to Supabase (may be blocked by corporate firewall)

**Razorpay test mode not working**
- Use test keys from Razorpay dashboard
- Test card: `4111111111111111` (any future date, any CVV)

---

## 📄 License

Proprietary. All rights reserved.

---

**Questions?** Open an issue or check `CLAUDE.md` for development guidance.
