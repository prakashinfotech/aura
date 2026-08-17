# Phase 7: Credentials & Secrets Management

Secure handling of API keys, tokens, and sensitive configuration.

---

## Current Credentials Inventory

### Supabase
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Endpoint | Public | .env | ✅ Safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Key | Public | .env | ✅ Safe |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Key | Private | .env | ✅ Secure |

### Razorpay
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Key | Public | .env | ✅ Safe |
| `RAZORPAY_KEY_ID` | Private Key | Private | .env | ✅ Secure |
| `RAZORPAY_KEY_SECRET` | Secret | Private | .env | ✅ Secure |
| `RAZORPAY_WEBHOOK_SECRET` | Secret | Private | .env | ✅ Secure |

### Messaging (Email)
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `RESEND_API_KEY` | Secret | Private | .env | ✅ Secure |
| `RESEND_FROM_EMAIL` | Email | Public | .env | ✅ Safe |

### Messaging (SMS)
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `MSG91_AUTH_KEY` | Secret | Private | .env | ✅ Secure |
| `MSG91_OTP_TEMPLATE_ID` | ID | Private | .env | ✅ Secure |

### Application Secrets
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `CRON_SECRET` | Secret | Private | .env | ✅ Secure |
| `ISR_REVALIDATION_SECRET` | Secret | Private | .env | ✅ Secure |

### Monitoring
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Endpoint | Public | .env | ✅ Safe |
| `SENTRY_AUTH_TOKEN` | Secret | Private | .env | ✅ Secure |

### Logistics
| Variable | Type | Visibility | Location | Status |
|----------|------|-----------|----------|--------|
| `DELHIVERY_API_KEY` | Secret | Private | .env | ✅ Secure |
| `LOGISTICS_WEBHOOK_SECRET` | Secret | Private | .env | ✅ Secure |

---

## Secrets Currently in Code

### Verified: ✅ No hardcoded secrets found
- ✅ No API keys in source code
- ✅ No passwords in Git
- ✅ No tokens in commits
- ✅ All sensitive data in .env only

**Verification Command:**
```bash
# Search for common secret patterns
git log -p -S "RAZORPAY_KEY" | head
git log -p -S "api_key" | head
git log -p -S "secret" | head

# Scan for exposed keys (use git-secrets hook)
git secrets --scan
```

---

## Environment Variable Management

### Current Setup
```
.env.example          ← Template (safe, no values)
.env.local           ← Actual values (gitignored)
.env.production      ← Production values (safe storage)
```

### .gitignore Configuration
**Verified entries:**
```
.env.local           ✅ Ignored
.env.*.local         ✅ Ignored
.env.production      ✅ Ignored
```

---

## Secret Rotation Procedures

### Supabase Keys

#### When to Rotate
- Quarterly (scheduled)
- Immediately if exposed
- After team member leaves
- Before public release

#### Rotation Steps
```bash
# 1. Go to Supabase dashboard
# 2. Settings → API → Regenerate Service Role Key
# 3. Update .env files
# 4. Restart app
# 5. Verify app still works
# 6. Monitor logs for errors
# 7. Document rotation date
```

### Razorpay Keys

#### When to Rotate
- After credential leak
- On security incident
- Annual rotation (recommended)

#### Rotation Steps
```bash
# 1. Log into Razorpay dashboard
# 2. Settings → API Keys → Generate New Key
# 3. Keep old key active (testing)
# 4. Update app .env files
# 5. Deploy and verify
# 6. Deactivate old key
# 7. Monitor transactions
```

### Third-Party API Keys

```bash
# Resend → Settings → API Keys → Generate New
# MSG91 → Account → API Keys → Generate New
# Sentry → Settings → Auth Tokens → Generate New
# Delhivery → Settings → API Keys → Generate New
```

---

## Secret Storage in CI/CD

### GitHub Secrets Setup

For GitHub Actions deployments:

```bash
# 1. Go to repo → Settings → Secrets and Variables → Actions
# 2. Add repository secrets:
SUPABASE_SERVICE_ROLE_KEY=...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=...
# etc.

# 3. Reference in workflows:
- name: Deploy
  env:
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Vercel Integration

```bash
# 1. Link project to Vercel
# 2. Go to Project Settings → Environment Variables
# 3. Add secret variables (marked as "Sensitive")
# 4. Variables auto-unavailable in browser ✅
```

### Production Deployment

**Recommended:**
- Use Vercel built-in secrets for Vercel deployments
- Use AWS Secrets Manager for self-hosted
- Use Hashicorp Vault for enterprise

---

## Detecting Exposed Credentials

### Real-time Detection
```bash
# Install git-secrets
brew install git-secrets

# Add patterns to detect
git secrets --install
git config --global secrets.patterns '(RAZORPAY_KEY|API_KEY|SECRET_KEY)'

# Scan repository
git secrets --scan

# Add pre-commit hook
git secrets --install -f
```

### Automated Scanning
```yaml
# .github/workflows/secrets-scan.yml
name: Secrets Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: trufflesecurity/trufflehog@main
```

---

## Incident Response

### If Credentials are Exposed

**Immediate Actions (< 5 minutes):**
1. [ ] **Rotate immediately** - Change all exposed keys
2. [ ] **Verify access logs** - Check for unauthorized usage
3. [ ] **Disable old key** - Prevent further misuse
4. [ ] **Update .env files** - All environments

**Short-term (< 1 hour):**
5. [ ] **Test app functionality** - Ensure new keys work
6. [ ] **Monitor transactions** - Watch for suspicious activity
7. [ ] **Notify team** - Communicate incident
8. [ ] **Document incident** - Record timeline and actions

**Follow-up (< 24 hours):**
9. [ ] **Review logs** - Identify what was accessed
10. [ ] **Notify users** (if needed) - If data was compromised
11. [ ] **Update passwords** - If auth tokens exposed
12. [ ] **Post-incident review** - Prevent future incidents

### Example Response
```bash
# 1. Rotate key immediately
# (Log into Supabase → Regenerate Service Role Key)

# 2. Update .env and redeploy
SUPABASE_SERVICE_ROLE_KEY="new_key_here"
git add .env
# (Actually: update in Vercel secrets, not Git)

# 3. Verify with test
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/products?limit=1

# 4. Monitor
# Check Supabase logs for suspicious queries
# Check Razorpay logs for suspicious transactions

# 5. Document
# File incident report with date/time/impact
```

---

## Secret Lifecycle

### Creation
```
Generate → Store in .env → Never commit → Add to .gitignore
```

### Usage
```
Read from env → Use in app → Never log → Never expose
```

### Rotation
```
Generate new → Update .env → Test → Disable old → Monitor
```

### Retirement
```
Check no code uses → Remove from .env → Remove from docs → Archive
```

---

## Access Control

### Who Has Access

| Role | Supabase | Razorpay | Resend | GitHub |
|------|----------|----------|--------|--------|
| Admin | ✅ Full | ✅ Full | ✅ Full | ✅ Admin Secrets |
| Devs | ✅ Limited | ❌ No | ❌ No | ✅ Read-only |
| DevOps | ✅ Full | ✅ Full | ✅ Full | ✅ Secrets Admin |

### Principle of Least Privilege
- Developers don't need production secrets
- Only DevOps/Admins have full access
- Use separate dev/staging/prod keys
- Document who has access and why

---

## Environment Separation

### Development
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321      # Local
SUPABASE_SERVICE_ROLE_KEY=dev_key_not_real           # Dev only
RAZORPAY_KEY_SECRET=test_key_not_real                # Test mode
```

### Staging
```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-proj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=staging_real_key           # Staging only
RAZORPAY_KEY_SECRET=test_key_staging                 # Test mode
```

### Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-proj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod_real_key              # Production only
RAZORPAY_KEY_SECRET=live_key_production              # Live mode
```

---

## Compliance & Auditing

### Audit Trail
- [ ] Track who accessed secrets
- [ ] Log secret rotation dates
- [ ] Document incident response
- [ ] Review quarterly

### Compliance Requirements
- [ ] GDPR - Secure personal data
- [ ] PCI DSS - Secure payment data
- [ ] SOC 2 - Access controls
- [ ] ISO 27001 - Information security

### Documentation
- [ ] Maintain secrets inventory
- [ ] Document rotation procedures
- [ ] Keep incident logs
- [ ] Update team handbook

---

## Checklist

### Pre-Launch
- [ ] All secrets in .env only
- [ ] No secrets in Git history
- [ ] .gitignore includes .env files
- [ ] GitHub Secrets configured
- [ ] Vercel Secrets configured
- [ ] Rotation procedures documented
- [ ] Access control defined
- [ ] Incident response plan ready

### Post-Launch
- [ ] Monitor for exposed credentials
- [ ] Implement git-secrets hook
- [ ] Set up secret scanning in CI/CD
- [ ] Schedule rotation reminders
- [ ] Review access logs monthly
- [ ] Test rotation procedure
- [ ] Document any incidents
- [ ] Update incident response plan

### Quarterly
- [ ] Review all secrets inventory
- [ ] Rotate production keys
- [ ] Audit access logs
- [ ] Update team training
- [ ] Review compliance status

---

## Tools & Services

### Secret Management
| Tool | Use Case | Setup |
|------|----------|-------|
| Vercel Secrets | Vercel deployments | Built-in |
| GitHub Secrets | CI/CD workflows | Built-in |
| AWS Secrets Manager | Self-hosted | Dedicated |
| Hashicorp Vault | Enterprise | Complex |

### Detection
| Tool | Function |
|------|----------|
| git-secrets | Prevent commits |
| TruffleHog | Scan for exposed secrets |
| OWASP Secrets | Vulnerability scanning |

### Monitoring
| Tool | Function |
|------|----------|
| Supabase Logs | Database activity |
| Razorpay Webhooks | Payment events |
| Sentry | Application errors |

---

## References

- [OWASP Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Secrets](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Status:** Credentials management documented. Ready for implementation.

**Next:** Review checklist, implement access controls, then deploy securely.
