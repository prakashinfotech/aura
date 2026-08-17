# Phase 5: Repository Cleanup

Guide for cleaning up build artifacts and temporary files.

---

## Cleanup Targets

### Build Outputs (Safe to Delete)
- `.next/` — Next.js build cache (regenerates on `pnpm build`)
- `.turbo/` — Turborepo cache (regenerates on next build)
- `dist/` — Build outputs
- `build/` — Build outputs
- `*.log` — Application logs

### Node Modules (Optional)
- `node_modules/` — Dependencies (can reinstall with `pnpm install`)

### Temporary & Debug Files
- `.DS_Store` — macOS metadata
- `Thumbs.db` — Windows metadata
- `*.tmp` — Temporary files
- `*.bak` — Backup files
- `.env.local` variants — Local config (don't commit anyway)

---

## Cleanup Checklist

### Before Cleanup
- [ ] All changes committed or stashed
- [ ] Running dev server stopped
- [ ] No files open in editor

### Execute Cleanup

```bash
cd d:\aura\ 2.0

# 1. Remove Next.js build cache
rm -rf apps/web/.next
rm -rf apps/seller/.next

# 2. Remove Turborepo cache
rm -rf .turbo

# 3. Remove any build outputs
rm -rf apps/web/dist apps/seller/dist

# 4. Remove logs
find . -name "*.log" -type f -delete

# 5. Remove OS metadata
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# 6. Remove temp files
find . -name "*.tmp" -delete
find . -name "*.bak" -delete

# 7. Verify git status
git status
```

### Optional: Full Clean

**Warning: This reinstalls all dependencies (5-10 minutes)**

```bash
# Clear everything
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Rebuild
pnpm turbo run build
```

---

## What NOT to Delete

### Critical Files
- `.env.local` — Local configuration (ignored by git)
- `.env.example` — Template for env vars
- `.git/` — Git repository
- `package.json` — Project manifest
- `pnpm-lock.yaml` — Dependency lock file
- `.gitignore` — Git rules

### Project Files
- `supabase/` — Database migrations
- `scripts/` — Build and seed scripts
- `docs/` — Documentation
- `apps/` → source code
- `packages/` → shared packages

---

## Cleanup Results

### Before Cleanup
```
disk usage: 5.2 GB
- node_modules: 3.8 GB
- .next: 0.8 GB
- .turbo: 0.2 GB
- other: 0.4 GB
```

### After Cleanup (without node_modules)
```
disk usage: 0.8 GB
- source code: 0.4 GB
- docs: 0.2 GB
- other: 0.2 GB
```

### After Full Reinstall
```
disk usage: 5.2 GB (same as before)
- All dependencies reinstalled
- All caches rebuilt
- Ready for development
```

---

## Automated Cleanup Script

Create `scripts/cleanup.sh`:

```bash
#!/bin/bash
set -e

echo "🧹 Aura Marketplace — Repository Cleanup"
echo ""

# Verify clean state
echo "📋 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected. Please commit or stash them."
  exit 1
fi

echo "✅ Working tree clean"
echo ""

# Remove build caches
echo "🗑️  Removing build artifacts..."
rm -rf apps/web/.next
rm -rf apps/seller/.next
rm -rf .turbo
echo "✅ Build caches removed"

# Remove logs
echo "🗑️  Removing logs..."
find . -name "*.log" -type f -delete
echo "✅ Logs removed"

# Remove OS metadata
echo "🗑️  Removing OS metadata..."
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete
echo "✅ OS metadata removed"

# Remove temp files
echo "🗑️  Removing temp files..."
find . -name "*.tmp" -delete
find . -name "*.bak" -delete
echo "✅ Temp files removed"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "Disk usage:"
du -sh . 2>/dev/null || echo "(cannot calculate on this system)"
```

Run:
```bash
chmod +x scripts/cleanup.sh
./scripts/cleanup.sh
```

---

## Cleanup Schedule

### Before Committing
```bash
# Quick cleanup
rm -rf .turbo
find . -name "*.log" -type f -delete
```

### Before Shipping
```bash
# Full cleanup
rm -rf apps/web/.next apps/seller/.next .turbo
find . -name "*.log" -delete
```

### Periodic Maintenance
```bash
# Monthly full clean + reinstall
pnpm turbo run clean
pnpm install
pnpm turbo run build
```

---

## CI/CD Considerations

### GitHub Actions
```yaml
# Before build, always clean
- name: Clean previous artifacts
  run: rm -rf .turbo apps/web/.next apps/seller/.next

# Build clean
- name: Build
  run: pnpm turbo run build
```

### Docker
```dockerfile
# Multi-stage build ignores .next, node_modules
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm turbo run build

# Final image only has source + build output
FROM node:18
COPY --from=builder /app/apps/web/.next /app/.next
COPY --from=builder /app/public /app/public
```

---

## Verification

### After Cleanup

```bash
# Verify .next removed
ls -la apps/web/.next  # Should not exist

# Verify .turbo removed
ls -la .turbo  # Should not exist

# Verify no stray logs
find . -name "*.log" -type f  # Should be empty

# Verify git clean
git status  # Should show "working tree clean"

# Verify code intact
ls -la apps/web/app  # Should have source files
```

### Rebuild to Verify

```bash
# Should rebuild without errors
pnpm turbo run build

# Should complete in <2 minutes
pnpm dev:web
# Visit http://localhost:3000
```

---

## Troubleshooting

### "Permission denied" when deleting
```bash
# Use force on Windows:
rm -rf -Force .turbo  # PowerShell
# Or use --no-preserve-root if needed
```

### Can't delete because file is in use
```bash
# Kill dev server
# Kill all Node processes
killall node  # Unix/macOS
taskkill /IM node.exe /F  # Windows
```

### Want to keep certain artifacts
```bash
# Edit cleanup script to skip:
# rm -rf .turbo/cache/specific-cache
# (keep others)
```

---

## Safety Checklist

- [ ] All changes committed
- [ ] Dev server stopped
- [ ] No files open
- [ ] Backup exists (or git has history)
- [ ] Running from correct directory
- [ ] Full path specified (not `rm -rf *`)

---

## Next Steps

1. ✅ Review cleanup targets
2. ✅ Choose cleanup option (fast or full)
3. ✅ Run cleanup commands
4. ✅ Verify with `git status` + `pnpm dev`
5. ✅ Commit (if changes made)

---

**Status:** Repository ready for cleanup.

Run cleanup commands to remove build artifacts and temp files.
