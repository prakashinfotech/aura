# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Current State: Aura Marketplace

This directory is a **pnpm + Turborepo monorepo** implementing a full-stack fashion e-commerce platform. It includes:
- `apps/web` — buyer-facing application (Next.js 15 with SSR/ISR)
- `apps/seller` — seller portal (Next.js 15 CSR)
- Shared packages for UI components, database clients, and validators
- Supabase backend with PostgreSQL 15
- Razorpay payment integration

**To develop:** Run `pnpm install`, then `pnpm dev:web` or `pnpm dev:seller` to start development servers.

**To preview:** Open http://localhost:3000 (buyer app) or http://localhost:3001 (seller app) after running dev servers.

---

## Monorepo Structure

| Path | Purpose |
|---|---|
| `apps/web/` | Buyer-facing Next.js 15 app with product browsing, cart, checkout, order history |
| `apps/seller/` | Seller portal for product management, order fulfillment, analytics |
| `packages/ui/` | Shared shadcn/ui component library with Tailwind CSS 4 tokens |
| `packages/db/` | Supabase client wrappers, generated TypeScript types, RPC definitions |
| `packages/validators/` | Shared Zod schemas for auth, products, orders, addresses |
| `packages/config/` | Shared TypeScript and ESLint configs |
| `supabase/migrations/` | Versioned PostgreSQL migration scripts (apply before UI development) |
| `docs/` | Architecture docs, requirements, and setup guides |

---

## Architecture Highlights

### Styling & Theming
- **Tokens:** Design tokens defined in `packages/ui/src/tokens.css` with CSS custom properties
- **Current Palette:** Indigo primary (#6366f1), Dark secondary (#1f2937), Amber highlight (#f59e0b)
- **Framework:** Tailwind CSS 4 with shadcn/ui components
- **Dark/Light Modes:** Supported via CSS variables and `prefers-color-scheme` media query

### State Management
- **Buyer App (web):** TanStack Query v5 for server state, Zustand for client state (cart, wishlist)
- **Seller App:** React Hook Form + Zod for form validation, TanStack Table for data grids
- **Real-time:** Supabase Realtime for order updates and notifications

### API Integration
- **Database:** Supabase PostgreSQL with edge functions
- **Authentication:** Supabase Auth with magic links / OAuth
- **Payments:** Razorpay with webhook verification for order settlement
- **Email:** Resend for transactional email (orders, password resets)

---

## Design Tokens (CSS Variables)

Defined in `packages/ui/src/tokens.css`:

| Token | Purpose | Current Value |
|---|---|---|
| `--brand` | Primary CTA color | `#6366f1` (Indigo) |
| `--brand-hover` | Brand button hover state | `#4f46e5` |
| `--brand-soft` | Light brand tint (backgrounds) | `#f0f4ff` |
| `--secondary` | Header, text, footer | `#1f2937` |
| `--highlight` | Hot badges, deals | `#f59e0b` (Amber) |
| `--background` | Page background | `#f5f5f6` |
| `--foreground` | Body text | `#282c3f` |
| `--border` | Dividers and outlines | `#e9e9eb` |
| `--radius-*` | Border radius (sm/md/lg/xl) | `4px` / `8px` / `12px` / `16px` |
| `--shadow-*` | Shadow elevation (sm/md/lg) | Defined with opacity |

---

## Current Technology Stack

This **pnpm + Turborepo monorepo** is production-ready with two Next.js 15 apps:

- `apps/web` — buyer-facing (SSR/ISR + CSR; Vercel-ready)
- `apps/seller` — seller portal (CSR; Vercel-ready)
- `packages/ui` — shared shadcn/ui component library
- `packages/db` — Supabase client, generated TypeScript types, RPC wrappers
- `packages/validators` — shared Zod schemas for validation
- `supabase/migrations/` — versioned SQL migrations (apply before writing UI)

**Stack**: React 19 + Next.js 15 App Router · TypeScript strict · Tailwind CSS 4 · Supabase (PostgreSQL 15, Auth, Storage, Edge Functions, Realtime) · Razorpay (Orders + Payouts + Webhooks) · TanStack Query v5 · Zustand · React Hook Form + Zod · pnpm workspaces · Turborepo

Architecture docs: [`docs/CLAUDE_CODE_PROMPT.md`](docs/CLAUDE_CODE_PROMPT.md)

### Database-First Rule
All Supabase migrations must be applied before writing any UI that depends on those tables. Migration order: Extensions → Auth/Profiles → Catalog → Commerce → Financials/Loyalty/Platform → RPCs → pg_cron jobs.

### Build Commands (once monorepo is initialized)
```bash
pnpm install                          # Install all workspace deps
pnpm turbo run build                  # Build all apps + packages
pnpm turbo run build --filter=web     # Build buyer app only
pnpm turbo run dev --filter=web       # Dev server for buyer app
pnpm turbo run dev --filter=seller    # Dev server for seller app
pnpm turbo run lint                   # ESLint across all packages
pnpm turbo run type-check             # tsc --noEmit across all packages
pnpm turbo run test                   # Vitest unit tests
supabase gen types typescript --local > packages/db/src/types.ts  # Regenerate DB types after migrations
```

### Color Palette (Aura Brand)
| Token | Value | Use |
|---|---|---|
| Primary | `#6366f1` | Primary CTAs, active states, links |
| Brand Hover | `#4f46e5` | Button hover, interactive states |
| Secondary | `#1f2937` | Header, body text, footer |
| Highlight | `#f59e0b` | Hot badges, deals, emphasis |
| Background | `#f5f5f6` | Page background, skeletons |
| Success | `#03a685` | Confirmation, order completion |
| Warning | `#ff9800` | Warnings, alerts |
| Error | `#f32f2f` | Errors, cancellation |
