# Aura Marketplace — Architecture & System Design

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["👥 Buyer App<br/>(Next.js 15, port 3000)"]
        SELLER["🏪 Seller Portal<br/>(Next.js 15, port 3001)"]
    end

    subgraph "API & Middleware"
        MIDDLEWARE["Auth & RLS<br/>Middleware"]
        WEB_API["Web API Routes<br/>/api/orders, /api/upload"]
        SELLER_API["Seller API Routes<br/>/api/dispatch, /api/settlements"]
    end

    subgraph "Data & Services"
        DB["🗄️ Supabase<br/>PostgreSQL 15"]
        STORAGE["📦 Storage<br/>S3-compatible"]
        REALTIME["⚡ Realtime<br/>WebSocket"]
    end

    subgraph "External Services"
        RAZORPAY["💳 Razorpay<br/>Payments & Payouts"]
        RESEND["📧 Resend<br/>Email"]
        MSG91["📱 MSG91<br/>SMS & OTP"]
    end

    subgraph "Shared Packages"
        UI_PKG["@aura/ui<br/>Components & Tokens"]
        DB_PKG["@aura/db<br/>Supabase Client"]
        VALIDATOR_PKG["@aura/validators<br/>Zod Schemas"]
        CONFIG_PKG["@aura/config<br/>TS & ESLint"]
    end

    WEB --> MIDDLEWARE
    SELLER --> MIDDLEWARE
    MIDDLEWARE --> WEB_API
    MIDDLEWARE --> SELLER_API
    WEB_API --> DB_PKG
    SELLER_API --> DB_PKG
    DB_PKG --> DB
    WEB_API --> RAZORPAY
    WEB_API --> RESEND
    DB_PKG --> STORAGE
    DB_PKG --> REALTIME
    WEB --> UI_PKG
    SELLER --> UI_PKG
    WEB_API --> VALIDATOR_PKG
    SELLER_API --> VALIDATOR_PKG
    SELLER_API --> RAZORPAY
    REALTIME -.->|Order updates| WEB
    REALTIME -.->|Settlement status| SELLER
```

## Data Flow — Product Browsing

```mermaid
graph LR
    USER["👤 User"]
    WEB["Buyer App<br/>(TanStack Query)"]
    CACHE["React Query Cache"]
    API["API Route"]
    SUPABASE["Supabase Client"]
    DB["PostgreSQL"]

    USER -->|Click category| WEB
    WEB -->|useQuery| CACHE
    CACHE -->|Cache miss| API
    API -->|select()| SUPABASE
    SUPABASE -->|SQL| DB
    DB -->|product rows| SUPABASE
    SUPABASE -->|JSON| API
    API -->|response| CACHE
    CACHE -->|render| WEB
    WEB -->|display| USER
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🌐 Browser
    participant NextAuth as Next.js Auth
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    participant JWT as JWT Token

    User->>Browser: Click "Sign In"
    Browser->>NextAuth: POST /api/auth/signin
    NextAuth->>Supabase: signInWithPassword(email, pwd)
    Supabase->>DB: Verify user & credentials
    DB-->>Supabase: ✅ Valid
    Supabase->>JWT: Generate access + refresh tokens
    JWT-->>Browser: Set cookies (httpOnly, secure)
    Browser-->>User: Redirect to /account/profile
    User->>Browser: Click protected route
    Browser->>NextAuth: Check session (middleware)
    NextAuth->>JWT: Validate access token
    JWT-->>NextAuth: ✅ Valid
    NextAuth-->>Browser: Allow access
```

## Order Processing Flow

```mermaid
graph TD
    USER["👤 Customer"]
    CART["🛒 Cart<br/>(Zustand)"]
    CHECKOUT["💳 Checkout Page"]
    RAZORPAY_UI["Razorpay Payment<br/>Modal"]
    
    API_CREATE["POST /api/orders/create<br/>→ Create pending order"]
    DB_PENDING["📊 orders table<br/>status: pending"]
    
    RAZORPAY["💳 Razorpay API<br/>Create payment session"]
    
    PAYMENT_OK["✅ User pays"]
    WEBHOOK["🔔 Webhook:<br/>payment.authorized"]
    
    API_VERIFY["POST /api/orders/verify<br/>→ Verify HMAC signature"]
    DB_PAID["📊 orders table<br/>status: paid"]
    
    EMAIL["📧 Order confirmation<br/>email via Resend"]
    SELLER_NOTIF["🏪 Seller notification<br/>via Realtime"]
    
    SUCCESS["✅ Order confirmed"]

    USER -->|Add items| CART
    CART -->|Review| CHECKOUT
    CHECKOUT -->|Click Pay| API_CREATE
    API_CREATE -->|Insert| DB_PENDING
    API_CREATE -->|session_id| RAZORPAY
    RAZORPAY -->|payment_id| RAZORPAY_UI
    RAZORPAY_UI -->|Enter card details| PAYMENT_OK
    PAYMENT_OK -->|Server-to-server| WEBHOOK
    WEBHOOK -->|Order ID, signature| API_VERIFY
    API_VERIFY -->|Verify signature| WEBHOOK
    API_VERIFY -->|UPDATE| DB_PAID
    API_VERIFY -->|Send| EMAIL
    API_VERIFY -->|Publish event| SELLER_NOTIF
    EMAIL -->|Delivery| USER
    SELLER_NOTIF -->|New order| SUCCESS

    style DB_PAID fill:#90EE90
    style SUCCESS fill:#90EE90
```

## Seller Dashboard — Order Fulfillment

```mermaid
sequenceDiagram
    participant Seller as 🏪 Seller
    participant Dashboard as Seller Portal
    participant REALTIME as Supabase Realtime
    participant API as Dispatch API
    participant DB as PostgreSQL
    participant LOGISTICS as Delhivery API

    Seller->>Dashboard: Open /dashboard/orders
    Dashboard->>REALTIME: Subscribe to new orders
    REALTIME-->>Dashboard: Live order stream
    Dashboard-->>Seller: Display pending orders

    loop For each order
        Seller->>Dashboard: Click "Dispatch"
        Dashboard->>API: POST /api/dispatch
        API->>LOGISTICS: Create shipment
        LOGISTICS-->>API: AWB number + tracking
        API->>DB: UPDATE order_items<br/>status='dispatched'<br/>tracking_number=AWB
        DB->>REALTIME: Publish order_dispatched
        REALTIME->>Dashboard: Refresh order
        Dashboard-->>Seller: ✅ Order dispatched
    end
```

## State Management Architecture

```mermaid
graph TB
    subgraph "Client State (Browser)"
        ZUSTAND["🏪 Zustand Stores"]
        CART_STORE["cart-store<br/>(persisted)"]
        WISHLIST_STORE["wishlist-store<br/>(Set serializer)"]
        AUTH_STORE["auth-store"]
        
        ZUSTAND --> CART_STORE
        ZUSTAND --> WISHLIST_STORE
        ZUSTAND --> AUTH_STORE
    end

    subgraph "Server State (Supabase)"
        QUERY_CACHE["React Query Cache"]
        PRODUCTS["Products<br/>(staleTime: 5m)"]
        ORDERS["Orders<br/>(staleTime: 30s)"]
        REVIEWS["Reviews<br/>(staleTime: 1m)"]
        
        QUERY_CACHE --> PRODUCTS
        QUERY_CACHE --> ORDERS
        QUERY_CACHE --> REVIEWS
    end

    subgraph "Database (Source of Truth)"
        DB["PostgreSQL"]
    end

    CART_STORE -->|persist| localStorage
    WISHLIST_STORE -->|persist| localStorage
    PRODUCTS -->|fetch from| DB
    ORDERS -->|fetch from| DB
    REVIEWS -->|fetch from| DB
    localStorage -->|hydrate on load| CART_STORE
    localStorage -->|hydrate on load| WISHLIST_STORE
```

## Component Hierarchy — Buyer App

```mermaid
graph TD
    ROOT["RootLayout<br/>(layout.tsx)"]
    AUTH_PROVIDER["AuthModalProvider<br/>(context)"]
    MIDDLEWARE["Middleware<br/>(session, RLS)"]
    
    HEADER["Header"]
    SEARCH_BAR["SearchBar"]
    MOBILE_BOTTOM_NAV["MobileBottomNav<br/>(hide on desktop)"]
    MOBILE_MENU["MobileMenuDrawer"]
    CART_DRAWER["CartDrawer"]
    
    PAGES["Pages"]
    HOME["/ Home<br/>(Hero + ProductRow)"]
    CATEGORY["category/[[...slug]]<br/>(PLP + Filters)"]
    PRODUCT["product/[slug]<br/>(PDP + Reviews)"]
    SEARCH["search?q=<br/>(Search Results)"]
    WISHLIST["wishlist<br/>(Saved Items)"]
    CHECKOUT["checkout<br/>(Cart + Payment)"]
    ACCOUNT["account/*<br/>(Profile, Orders, Addresses)"]
    
    ROOT --> AUTH_PROVIDER
    ROOT --> MIDDLEWARE
    AUTH_PROVIDER --> HEADER
    HEADER --> SEARCH_BAR
    AUTH_PROVIDER --> MOBILE_BOTTOM_NAV
    AUTH_PROVIDER --> MOBILE_MENU
    AUTH_PROVIDER --> CART_DRAWER
    AUTH_PROVIDER --> PAGES
    
    PAGES --> HOME
    PAGES --> CATEGORY
    PAGES --> PRODUCT
    PAGES --> SEARCH
    PAGES --> WISHLIST
    PAGES --> CHECKOUT
    PAGES --> ACCOUNT
```

## Database Schema — Key Relationships

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ ADDRESSES : saves
    PROFILES ||--o{ REVIEWS : writes
    
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ REVIEWS : receives
    
    CATEGORIES ||--o{ PRODUCTS : "includes"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "selected as"
    
    SELLERS ||--o{ PRODUCTS : lists
    SELLERS ||--o{ ORDER_ITEMS : fulfills
    
    COUPONS ||--o{ ORDERS : "applied to"
    BANNERS ||--o{ CATEGORIES : "links to"
```

## Deployment Pipeline

```mermaid
graph LR
    DEV["👨‍💻 Developer<br/>Local Branch"]
    GH["🐙 GitHub<br/>Feature Branch"]
    PR["🔍 PR Review<br/>Type-check + Lint"]
    
    MAIN["main Branch<br/>Merge PR"]
    VERCEL["⚡ Vercel<br/>Build & Test"]
    
    WEB_STAGING["web (staging)<br/>https://web-staging.vercel.app"]
    SELLER_STAGING["seller (staging)<br/>https://seller-staging.vercel.app"]
    
    WEB_PROD["web (prod)<br/>https://aura.example.com"]
    SELLER_PROD["seller (prod)<br/>https://seller.aura.example.com"]
    
    DEV -->|git push| GH
    GH -->|Create PR| PR
    PR -->|Pass checks| MAIN
    MAIN -->|Auto-deploy| VERCEL
    VERCEL -->|Success| WEB_STAGING
    VERCEL -->|Success| SELLER_STAGING
    WEB_STAGING -->|Manual promote| WEB_PROD
    SELLER_STAGING -->|Manual promote| SELLER_PROD

    style WEB_PROD fill:#FFB6C6
    style SELLER_PROD fill:#FFB6C6
```

## Performance Optimization

### Image Optimization
- Next.js `<Image>` component with automatic sizing
- WebP format conversion
- Lazy loading with `loading="lazy"`
- Product images: 400×533px (3:4 aspect ratio)

### Caching Strategy
```
Static:        CSS, JS bundles, fonts → CDN cache (1 year)
ISR (Revalidate): Product catalog → 5 minutes
Dynamic:       User cart, orders → React Query (30s–5m staleTime)
Client:        Search, filters → React state (session)
```

### Bundle Size
- Tailwind CSS 4: tree-shaking unused styles
- Dynamic imports for modals: `React.lazy()`
- Code splitting per route via Next.js App Router

---

## Security Layers

```mermaid
graph TB
    USER["👤 User Request"]
    
    TLS["🔒 TLS 1.3<br/>All traffic encrypted"]
    CORS["🔐 CORS<br/>Same-origin only"]
    MIDDLEWARE["🛡️ Next.js Middleware<br/>Auth, session validation"]
    RLS["🔑 Row-Level Security<br/>PostgreSQL policies"]
    VALIDATION["✅ Zod Validation<br/>Input sanitization"]
    
    USER -->|HTTPS| TLS
    TLS --> CORS
    CORS --> MIDDLEWARE
    MIDDLEWARE -->|Valid JWT| VALIDATION
    VALIDATION -->|Sanitized params| RLS
    RLS -->|User policy check| DATABASE["Database"]
    
    DATABASE -->|User can see own data| RESPONSE["✅ Response"]
    DATABASE -->|Policy denied| FORBIDDEN["❌ 403 Forbidden"]
```

---

## Monitoring & Observability (Optional)

```mermaid
graph LR
    APP["Aura Apps<br/>(web + seller)"]
    SENTRY["📊 Sentry<br/>Error tracking"]
    VERCEL_LOGS["📝 Vercel<br/>Deployment logs"]
    SUPABASE_LOGS["📋 Supabase<br/>Database logs"]
    
    APP -->|errors + performance| SENTRY
    APP -->|build logs| VERCEL_LOGS
    APP -->|query logs| SUPABASE_LOGS
    
    SENTRY -->|alerts| SLACK["Slack webhook"]
    VERCEL_LOGS -->|runtime errors| SLACK
    SUPABASE_LOGS -->|slow queries| SLACK
```

---

**For implementation details, see:**
- `docs/aura-clone-scope-of-work.md` — Full requirements
- `docs/CLAUDE_CODE_PROMPT.md` — Build task order
- `CLAUDE.md` — Development guidance
- `README.md` — Quick start & commands
