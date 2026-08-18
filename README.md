# 🏗️ Aura Marketplace

A full-stack fashion e-commerce platform built with modern web technologies. Features include a buyer-facing storefront, seller portal, product catalog management, shopping cart, checkout with Razorpay payments, and real-time order fulfillment.

**Status**: Production-ready monorepo with TypeScript strict mode, Tailwind CSS 4, Supabase backend, and Razorpay integration.

---

## 📊 System Architecture & Workflow

### Complete Architecture Diagram

```mermaid
graph TB
    subgraph Users["👥 Users & Roles"]
        Buyer["🛒 Buyer<br/>Browse & Purchase"]
        Seller["🏪 Seller<br/>Manage Store"]
        Admin["👨‍💼 Admin<br/>Platform Control"]
    end

    subgraph Frontend["🎨 Frontend Layer - Next.js 15"]
        WebApp["Web App<br/>Port 3000<br/>SSR/ISR<br/>Buyer Experience"]
        SellerApp["Seller Portal<br/>Port 3001<br/>CSR<br/>Store Management"]
        SharedUI["@aura/ui<br/>shadcn/ui<br/>Shared Components"]
    end

    subgraph SharedPkgs["📦 Shared Packages"]
        DB["@aura/db<br/>Supabase Clients<br/>Browser & Server"]
        Validators["@aura/validators<br/>Zod Schemas<br/>Form Validation"]
        Config["@aura/config<br/>TS Config<br/>ESLint Rules"]
    end

    subgraph State["🔄 State Management"]
        Query["TanStack Query v5<br/>Server State<br/>Product Data"]
        Zustand["Zustand<br/>Client State<br/>Cart & Auth"]
    end

    subgraph Backend["🔐 Backend - Supabase"]
        AuthDB["Authentication<br/>JWT • OTP • OAuth"]
        DataDB["PostgreSQL 15<br/>Products • Orders<br/>Users • Reviews"]
        Storage["File Storage<br/>Product Images<br/>User Avatars"]
        Realtime["Realtime<br/>Order Updates<br/>Notifications"]
    end

    subgraph External["🌐 External Services"]
        Razorpay["💳 Razorpay<br/>Payments<br/>Webhooks"]
        Resend["📧 Resend<br/>Transactional<br/>Emails"]
        MSG91["📱 MSG91<br/>SMS & OTP"]
    end

    Buyer -->|Browse & Pay| WebApp
    Seller -->|Manage| SellerApp
    Admin -->|Oversee| SellerApp

    WebApp -->|Components| SharedUI
    SellerApp -->|Components| SharedUI

    WebApp -->|Fetch Data| Query
    SellerApp -->|Fetch Data| Query
    WebApp -->|Local State| Zustand

    Query -->|Read/Write| DB
    DB -->|Connect| DataDB
    DB -->|Upload| Storage

    WebApp -->|Process Payment| Razorpay
    Razorpay -->|Webhook| WebApp
    WebApp -->|Send Email| Resend
    WebApp -->|OTP| MSG91

    DataDB -->|Broadcast| Realtime
    Realtime -->|Updates| WebApp
    Realtime -->|Updates| SellerApp

    style Users fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e293b
    style Frontend fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style SharedPkgs fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#1e293b
    style State fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#1e293b
    style Backend fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
    style External fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#1e293b
```

### Buyer Journey - Order Flow

```mermaid
sequenceDiagram
    participant Buyer as 🛒 Buyer
    participant Web as Web App<br/>Port 3000
    participant Store as Zustand Store<br/>Cart State
    participant Query as TanStack Query
    participant API as API Routes
    participant Razorpay as 💳 Razorpay
    participant Supabase as 🗄️ Supabase<br/>Database
    participant Realtime as 📡 Realtime
    participant Seller as 🏪 Seller Portal<br/>Port 3001
    participant Email as 📧 Resend

    Buyer->>Web: Browse Products
    Buyer->>Web: Add to Cart
    Web->>Store: Update Cart (localStorage)
    Store-->>Web: Cart Updated
    
    Buyer->>Web: Proceed to Checkout
    Web->>Query: Fetch Product Details
    Query->>Supabase: SELECT products
    Supabase-->>Query: Product Data
    Query-->>Web: Display Cart
    
    Buyer->>Web: Submit Order
    Web->>API: Create Order Session
    API->>Razorpay: Initialize Payment
    Razorpay-->>Web: Payment Link
    
    Buyer->>Razorpay: Pay ₹
    Razorpay->>API: Webhook (Verify)
    API->>Supabase: INSERT order + items
    Supabase-->>API: Order Created
    
    API->>Realtime: Broadcast Order
    Realtime->>Seller: New Order Notification
    Realtime->>Web: Show Confirmation
    
    API->>Email: Send Confirmation
    Email-->>Buyer: Order Email
```

### Project Structure

```
aura-marketplace (pnpm + Turborepo)
├── apps/
│   ├── web/                    # Buyer-facing (Next.js 15, SSR/ISR, port 3000)
│   │   ├── app/                # Routes & API handlers
│   │   ├── components/         # UI components (auth, product, layout)
│   │   ├── lib/                # Hooks, queries, utilities
│   │   ├── stores/             # Zustand (cart, wishlist, auth)
│   │   └── middleware.ts       # Route protection
│   │
│   └── seller/                 # Seller portal (Next.js 15, CSR, port 3001)
│       ├── app/                # Dashboard, products, orders
│       ├── components/         # Forms, tables, charts
│       ├── lib/                # Seller utilities
│       └── api/                # Dispatch, settlement APIs
│
├── packages/
│   ├── ui/                     # @aura/ui - Component Library
│   │   ├── components/         # Button, Input, Dialog, ProductCard, etc.
│   │   └── src/tokens.css      # Design tokens & CSS variables
│   │
│   ├── db/                     # @aura/db - Database Client
│   │   ├── client.ts           # Browser Supabase instance
│   │   ├── server.ts           # Server Supabase instance
│   │   └── types.ts            # Generated PostgreSQL types
│   │
│   ├── validators/             # @aura/validators - Zod Schemas
│   │   └── auth.ts, product.ts, order.ts, address.ts
│   │
│   └── config/                 # @aura/config - Shared Configs
│       ├── tsconfig.json       # TypeScript config
│       └── eslint.config.mjs   # ESLint rules
│
├── supabase/
│   ├── migrations/             # Versioned SQL migrations
│   │   ├── 001_extensions.sql
│   │   ├── 002_auth.sql
│   │   ├── 003_catalog.sql
│   │   ├── 004_commerce.sql
│   │   └── 005_rpcs.sql
│   └── seed_master.sql         # Static data (brands, categories)
│
├── scripts/
│   └── seed.mjs                # Populate sellers, products, variants
│
└── pnpm-workspace.yaml         # Workspace config
```

---

### Data Flow: Complete Payment Cycle

```mermaid
graph LR
    A["Cart Added<br/>Zustand Store"] -->|persist| B["localStorage"]
    B -->|user checkout| C["Checkout Page"]
    C -->|TanStack Query| D["Fetch Latest Prices<br/>Supabase"]
    D -->|product data| E["Display Cart Summary"]
    E -->|submit order| F["POST /api/orders/create"]
    F -->|session token| G["Razorpay SDK"]
    G -->|user pays| H["Payment Gateway"]
    H -->|success/fail| I["Webhook<br/>/api/webhooks/razorpay"]
    I -->|verify signature| J["Insert Order<br/>Supabase"]
    J -->|success| K["Broadcast via<br/>Supabase Realtime"]
    K -->|new order| L["Seller App<br/>Real-time Notification"]
    K -->|confirmation| M["Buyer App<br/>Order Status"]
    J -->|trigger| N["Send Email<br/>Resend API"]
    N -->|confirmation| O["Buyer Email"]

    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e293b
    style F fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style I fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#1e293b
    style J fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
    style K fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#1e293b
```

### State Management Architecture

```mermaid
graph TB
    subgraph ClientState["🔵 Client State - Zustand"]
        Auth["Auth Store<br/>- user<br/>- isLoggedIn<br/>- token"]
        Cart["Cart Store<br/>- items<br/>- total<br/>- itemCount"]
        Wishlist["Wishlist Store<br/>- savedItems<br/>- count"]
    end

    subgraph ServerState["🟢 Server State - TanStack Query"]
        Products["Products Query<br/>- list<br/>- detail<br/>- search"]
        Orders["Orders Query<br/>- user orders<br/>- tracking"]
        Reviews["Reviews Query<br/>- product reviews<br/>- ratings"]
    end

    subgraph LocalPersist["💾 localStorage"]
        CartPersist["cart-state"]
        WishlistPersist["wishlist-state"]
    end

    Auth -->|persist| LocalPersist
    Cart -->|persist| CartPersist
    Wishlist -->|persist| WishlistPersist

    Products -->|cached| QueryCache["TanStack Cache<br/>Invalidation Rules"]
    Orders -->|cached| QueryCache
    Reviews -->|cached| QueryCache

    Cart -->|checkout| QueryCache
    QueryCache -->|fetch| Supabase["Supabase"]

    style ClientState fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style ServerState fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
    style LocalPersist fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#1e293b
```

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React + React Compiler | 19.0.0 | UI rendering & optimization |
| **Meta-Framework** | Next.js (App Router) | 15.3.2 | SSR/ISR, API routes, routing |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS 4 | 4.3.0 | Utility-first CSS |
| **Components** | shadcn/ui + Radix | Latest | Accessible UI primitives |
| **Client State** | Zustand | 5.0.13 | Cart, wishlist, auth (persisted) |
| **Server State** | TanStack Query v5 | 5.100.10 | Data fetching & caching |
| **Forms** | React Hook Form + Zod | 7.75.0 + 3.25.63 | Form validation |
| **Database** | Supabase PostgreSQL | 15 | Cloud-hosted relational DB |
| **Authentication** | Supabase Auth | Latest | JWT, OAuth, OTP, Magic Link |
| **File Storage** | Supabase Storage | Latest | S3-compatible (images, avatars) |
| **Real-time** | Supabase Realtime | Latest | WebSocket subscriptions |
| **Payments** | Razorpay | 2.9.6 | Orders, payouts, webhooks |
| **Email** | Resend | 6.12.3 | Transactional emails |
| **SMS/OTP** | MSG91 | Latest | OTP delivery |
| **Build System** | Turborepo | 2.9.12 | Monorepo orchestration |
| **Package Manager** | pnpm | 9.15.9 | Fast dependency management |
| **Deployment** | Vercel | Pro | Serverless hosting |

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

### Database Structure

```mermaid
erDiagram
    PROFILES ||--o{ ADDRESSES : saves
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ REVIEWS : writes
    PROFILES ||--o{ WISHLIST : saves
    PROFILES ||--o{ SELLERS : manages

    CATEGORIES ||--o{ PRODUCTS : contains
    BRANDS ||--o{ PRODUCTS : manufactures
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ REVIEWS : receives

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDER_ITEMS ||--o{ PRODUCT_VARIANTS : orders
    PRODUCT_VARIANTS ||--o{ INVENTORY : tracks

    SELLERS ||--o{ SELLER_BRANDS : manages
    SELLERS ||--o{ SETTLEMENTS : receives

    COUPONS ||--o{ ORDERS : applied_to

    PROFILES {
        uuid id PK
        string email UK
        string name
        string phone
        string avatar_url
        timestamp created_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        uuid brand_id FK
        string name
        text description
        decimal rating
        int review_count
        boolean is_active
    }

    ORDERS {
        uuid id PK
        uuid profile_id FK
        decimal total_amount
        string status
        timestamp created_at
    }

    SELLERS {
        uuid id PK
        uuid profile_id FK
        string store_name
        string logo_url
        decimal rating
    }
```

**Core Tables:**
- `profiles` — User profiles (extends auth.users)
- `categories` — Product categories (men, women, kids, accessories)
- `brands` — Brand information
- `products` — Product master data
- `product_variants` — Size, color, SKU, pricing, inventory
- `product_images` — Product photos (Supabase Storage)
- `addresses` — Saved delivery addresses
- `orders` — Customer orders with total & status
- `order_items` — Line items with product variant reference
- `reviews` — Product reviews & ratings
- `wishlist` — Saved items
- `sellers` — Seller store information
- `seller_brands` — Seller-specific brand management
- `settlements` — Payout records
- `coupons` — Discount codes & offers
- `banners` — Hero & category banners

**Key Relationships:**
- `profiles` → `addresses, orders, reviews, sellers, wishlist` (1:N)
- `categories` → `products` (1:N)
- `brands` → `products` (1:N)
- `products` → `product_variants, product_images, reviews` (1:N)
- `orders` → `order_items` (1:N)
- `order_items` → `product_variants` (N:1)

**RLS Policies:**
- Users can only view/edit their own addresses, orders, reviews
- Sellers can only manage their own products, orders, settlements
- Public can view published products, brands, categories

**Generate TypeScript Types:**
```bash
supabase gen types typescript --local > packages/db/src/types.ts
```

---

## 🔌 API Routes & Endpoints

### Buyer App (web) - API Routes

```mermaid
graph TB
    subgraph Auth["Authentication"]
        Login["POST /auth/callback<br/>OAuth callback"]
    end

    subgraph Orders["Orders & Payments"]
        CreateOrder["POST /api/orders/create<br/>Initialize Razorpay session"]
        VerifyOrder["POST /api/orders/verify<br/>Verify payment webhook"]
        WebhookRazor["POST /api/webhooks/razorpay<br/>Payment confirmation"]
    end

    subgraph Upload["File Operations"]
        UploadAvatar["POST /api/upload/avatar<br/>Upload user avatar to Supabase"]
    end

    Login -->|Supabase Callback| AuthSuccess["User Authenticated<br/>JWT Token Set"]
    CreateOrder -->|Razorpay| Payment["Payment Gateway"]
    Payment -->|Webhook| WebhookRazor
    WebhookRazor -->|Verify| VerifyOrder
    VerifyOrder -->|Insert| Database["Supabase<br/>Orders Table"]
    UploadAvatar -->|File Upload| Storage["Supabase Storage"]

    style Auth fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style Orders fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
    style Upload fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#1e293b
```

### Seller App - API Routes

```mermaid
graph TB
    subgraph Dispatch["Order Management"]
        DispatchOrder["POST /api/dispatch<br/>Mark order as dispatched"]
    end

    subgraph Settlement["Payment"]
        RequestSettle["POST /api/settlements/request<br/>Request payout"]
    end

    DispatchOrder -->|Update Status| Database["Supabase<br/>Orders Table"]
    Database -->|Broadcast| Realtime["Realtime Event<br/>Buyer sees update"]
    RequestSettle -->|Calculate Amount| Razorpay["Razorpay<br/>Payout API"]

    style Dispatch fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
    style Settlement fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#1e293b
```

## 🌊 Complete User Workflows

### 👤 Buyer Workflow

```mermaid
graph TD
    A["🏠 Visit Homepage"] --> B["🔍 Search/Browse Products"]
    B --> C["📄 View Product Details"]
    C --> D{"❓ Want to Buy?"}
    D -->|No| B
    D -->|Yes| E["🔐 Login/Signup"]
    E --> F["🛒 Add to Cart<br/>Zustand Store"]
    F --> G{"🔄 Continue Shopping?"}
    G -->|Yes| B
    G -->|No| H["🛍️ Go to Checkout"]
    H --> I["📍 Enter/Select Address"]
    I --> J["🎟️ Apply Coupon"]
    J --> K["💳 Review Order"]
    K --> L["💰 Pay via Razorpay"]
    L --> M{"✅ Payment Success?"}
    M -->|No| L
    M -->|Yes| N["📧 Email Confirmation"]
    N --> O["👁️ View Order Status"]
    O --> P["⭐ Leave Review"]

    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e293b
    style E fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style F fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#1e293b
    style L fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#1e293b
    style N fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
```

### 🏪 Seller Workflow

```mermaid
graph TD
    A["📝 Register Store"] --> B["✅ Admin Verification"]
    B --> C["🏪 Access Dashboard"]
    C --> D["📦 Create Product"]
    D --> E["🖼️ Upload Images"]
    E --> F["📊 Create Variants<br/>Size, Color, SKU"]
    F --> G["🎯 Set Pricing & Stock"]
    G --> H["👁️ Publish Product"]
    H --> I["📬 Wait for Orders<br/>Real-time Notifications"]
    I --> J["📦 Prepare Order"]
    J --> K["🚚 Mark as Dispatched"]
    K --> L["📡 Buyer Gets Update<br/>Realtime"]
    L --> M["💰 Request Settlement"]
    M --> N["💳 Receive Payout<br/>Razorpay"]

    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e293b
    style D fill:#dbeafe,stroke:#2874f0,stroke-width:2px,color:#1e293b
    style H fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#1e293b
    style I fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#1e293b
    style N fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#1e293b
```

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

---

## 📖 Documentation

This README includes:
- ✅ Complete architecture diagrams (Mermaid)
- ✅ System workflow visualization
- ✅ Buyer & seller user journeys
- ✅ Data flow diagrams (checkout cycle)
- ✅ State management architecture
- ✅ Database schema (ER diagram)
- ✅ API routes mapping
- ✅ Technology stack breakdown
- ✅ Setup & deployment guides

For more details, see:
- `CLAUDE.md` — Development guidance
- `docs/aura-marketplace-requirements.md` — Full requirements
- `docs/CLAUDE_CODE_PROMPT.md` — Build task ordering

---

**Questions?** Open an issue or check `CLAUDE.md` for development guidance.
