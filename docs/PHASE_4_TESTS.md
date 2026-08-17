# Phase 4: Testing

Guide for running and maintaining tests across Aura Marketplace.

---

## Test Setup

### Current Configuration

The monorepo uses:
- **Test Runner:** Vitest (configured in packages)
- **Component Testing:** React Testing Library (for React components)
- **E2E Testing:** Playwright (optional, configured but not required)
- **Type Checking:** TypeScript strict mode (for all packages)

### Package Test Scripts

| Package | Script | Purpose |
|---------|--------|---------|
| **root** | `pnpm test` | Run all tests via Turborepo |
| **@aura/ui** | `pnpm --filter=@aura/ui run test` | Component library tests |
| **@aura/db** | `pnpm --filter=@aura/db run test` | Database client tests |
| **@aura/validators** | `pnpm --filter=@aura/validators run test` | Schema validation tests |
| **web app** | `pnpm --filter=web run test` | Buyer app tests |
| **seller app** | `pnpm --filter=seller run test` | Seller portal tests |

---

## Running Tests

### All Tests
```bash
pnpm test
```

Expected output:
```
@aura/ui: test ✓
@aura/db: test ✓
@aura/validators: test ✓
web: test ✓
seller: test ✓
```

### Specific Package
```bash
# Component library
pnpm --filter=@aura/ui run test

# Database client
pnpm --filter=@aura/db run test

# Validators
pnpm --filter=@aura/validators run test

# Buyer app
pnpm --filter=web run test

# Seller app
pnpm --filter=seller run test
```

### Watch Mode
```bash
# All tests
pnpm test -- --watch

# Single package
pnpm --filter=@aura/ui run test -- --watch
```

### Coverage Report
```bash
# All packages
pnpm test -- --coverage

# Single package
pnpm --filter=@aura/ui run test -- --coverage
```

---

## Test Structure

### Unit Tests
- Location: `packages/*/src/**/*.test.ts`
- Framework: Vitest
- Example: Testing Zod validators

### Component Tests
- Location: `packages/ui/src/components/**/*.test.tsx`
- Framework: React Testing Library
- Example: Testing Button, Input components

### Integration Tests
- Location: `apps/*/app/**/*.test.ts`
- Framework: Vitest + React Testing Library
- Example: API route tests

### E2E Tests (Optional)
- Location: `apps/*/e2e/**/*.spec.ts`
- Framework: Playwright
- Example: User flows (homepage → product → checkout)

---

## Adding Tests

### Component Test Example

Create `packages/ui/src/components/button.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(onClick).toHaveBeenCalled()
  })

  it('applies variant styles', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('bg-brand')
  })
})
```

### Validator Test Example

Create `packages/validators/src/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { loginSchema } from './auth'

describe('loginSchema', () => {
  it('validates correct credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'ValidPass123!'
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'ValidPass123!'
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'weak'
    })
    expect(result.success).toBe(false)
  })
})
```

### API Route Test Example

Create `apps/web/app/api/orders/verify.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

describe('POST /api/orders/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies valid payment signature', async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({
        razorpay_payment_id: 'pay_123',
        razorpay_order_id: 'order_123',
        razorpay_signature: 'valid_signature'
      })
    }

    const res = await POST(mockReq as any)
    expect(res.status).toBe(200)
  })

  it('rejects invalid signature', async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({
        razorpay_signature: 'invalid_signature'
      })
    }

    const res = await POST(mockReq as any)
    expect(res.status).toBe(400)
  })
})
```

---

## Type Checking

TypeScript strict mode is enforced across all packages.

### Check Types
```bash
# All packages
pnpm turbo run type-check

# Single package
pnpm --filter=@aura/ui run type-check

# Watch mode (if supported)
pnpm turbo run type-check -- --watch
```

### Fix Type Errors
```bash
# Types must be fixed manually (TypeScript reports, you fix)
# Then verify with:
pnpm turbo run type-check
```

---

## Linting

ESLint is configured per package.

### Check Linting
```bash
# All packages
pnpm turbo run lint

# Single package
pnpm --filter=@aura/ui run lint

# Auto-fix
pnpm turbo run lint -- --fix
```

---

## Test Coverage Goals

| Package | Coverage Target | Status |
|---------|-----------------|--------|
| @aura/ui | 80%+ | TBD |
| @aura/db | 70%+ | TBD |
| @aura/validators | 85%+ | TBD |
| web app | 60%+ | TBD |
| seller app | 60%+ | TBD |

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run on every PR via GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: pnpm turbo run type-check
      - run: pnpm turbo run lint
      - run: pnpm turbo run test
```

---

## Testing Best Practices

### Do's ✅
- Write tests for edge cases
- Test error scenarios
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies
- Test public API, not implementation details

### Don'ts ❌
- Skip tests for "simple" code
- Test implementation details
- Use magic numbers without explanation
- Depend on test execution order
- Mock everything (use real instances where possible)

---

## Troubleshooting

### "Cannot find module '@testing-library/react'"
```bash
pnpm install
```

### Tests timeout
- Increase timeout in vitest.config.ts
- Check for infinite loops in code
- Verify mocks are set up correctly

### Type errors prevent testing
```bash
# Fix types first
pnpm turbo run type-check

# Then run tests
pnpm test
```

### Test fails on CI but passes locally
- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Check environment variables in .env

---

## Next Steps

1. **Write unit tests** for validators and utility functions
2. **Add component tests** for @aura/ui components
3. **Create integration tests** for API routes
4. **Set up code coverage** reporting
5. **Monitor test metrics** in CI/CD

---

**Status:** Test framework configured and ready for test writing.

To add tests, create `.test.ts` or `.test.tsx` files and run `pnpm test`.
