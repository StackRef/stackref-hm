# Sanitization

This repository was produced from StackRef HM's original **private, multi-repo**
codebase (11 GitLab repositories). Because that code ran a live SaaS on real AWS
accounts, it had to be sanitized before being made public. This document explains
exactly what was done so the result is auditable.

## Principles

1. **Source only.** The dangerous, high-signal artifacts were never copied into the
   public tree in the first place — not scrubbed afterward, *excluded at copy time*.
2. **Fresh history.** None of the original `.git` directories were copied. Git history
   commonly contains secrets that were later removed from the working tree; starting
   from a single clean commit eliminates that entire class of leak.
3. **Placeholders, not deletions.** Identifying values were replaced with obvious
   placeholders (`example.com`, `000000000000`, `YOUR_...`) so the code still reads
   sensibly and the shape of the configuration is preserved.
4. **Reproducible & documented.** The tooling lives in [`../scripts/`](../scripts/).

## What was excluded at copy time

The copy step ([`scripts/build_monorepo.sh`](../scripts/build_monorepo.sh)) hard-excludes:

| Excluded | Why |
|---|---|
| `.git/` | History may contain removed secrets |
| `*.tfstate`, `*.tfstate.*` | Terraform state stores **plaintext** secrets |
| `.env`, `.env.*` | Real runtime configuration / keys |
| `*.tfvars` | Real variable values (regenerated as `*.tfvars.example`) |
| `*.pem`, `*.key`, `*.p12` | Key / certificate material |
| `node_modules/`, `.venv/`, `vendor/`, `package/` | Vendored dependencies |
| `.terraform/` | Provider binaries + cached state |
| `build/`, `dist/`, `payload*.zip` | Build artifacts |
| `.gitlab-ci.yml`, `.gitlab/` | GitLab-specific CI (build/deploy now in READMEs) |
| `.dccache`, `.DS_Store`, `.infracost/`, `sbom.json`, `.snyk` | Tooling noise |

Two real secret files that slipped a naïve glob (tenant-suffixed
`terraform.secret.tfvars-*` files holding live AWS keys, Stripe keys, an OpenAI key,
SCIM tokens, and OAuth secrets) were found and removed; sanitized
`*.secret.tfvars.example` templates were written in their place.

## What was replaced in the remaining text

The scrub step ([`scripts/scrub.py`](../scripts/scrub.py)) runs two layers:

**Layer 1 — generic credential patterns** (regexes for the *shape* of a secret, no real
values; safe to publish): AWS access keys (`AKIA…`), Sentry DSNs, Stripe keys
(`pk_`/`sk_`/`rk_`/`whsec_`/`prctbl_`), Slack webhooks, Google OAuth client IDs and
secrets (`GOCSPX-…`).

**Layer 2 — targeted real values**, listed in `scripts/scrub_targets.py`. That file is
**intentionally not committed** (it is the one place the real identifiers are written
down). A placeholder template, [`scripts/scrub_targets.example.py`](../scripts/scrub_targets.example.py),
shows its structure. Layer 2 replaced:

- ~75 real **AWS account IDs** → `000000000000`
- 5 **Auth0 client IDs** → `YOUR_AUTH0_CLIENT_ID`
- the specific **Sentry key** and two **MUI X Pro license keys** → placeholders
- **GTM/GA** analytics IDs → placeholders
- the original **customer/tenant name** → `acme`
- the operator's **personal handle** → `demo`
- live **brand domains** (the primary domain and its `.io`/`.cloud` variants, the SSO
  portal, Auth0 tenants, the GCP service-account domain) → `example.com` /
  `example-sso.awsapps.com` / etc.
- **personally identifiable information** — real names, a personal email domain, real
  phone numbers, and seed-data personal emails → neutral fakes

## Verifying

From the repo root:

```bash
# Report any identifying values still present (requires the local scrub_targets.py):
python3 scripts/scrub.py . --check

# Spot checks that should all return nothing (substitute your own former
# names/domains for the first one):
grep -rIlE "A(KIA|SIA)[0-9A-Z]{16}" .
grep -rIloE "https://[a-f0-9]{32}@o[0-9]+\.ingest\.sentry\.io/[0-9]+" .
find . -name '*.tfstate*' -o -name '.env'
```

The scrub is **idempotent** — re-running it makes no further changes.

## If you redeploy

Every placeholder marks something you must supply. Start from the `*.example` files,
the `frontend/.env.example`, and the `*.tfvars.example` templates. And — because they
lived in the original private history — **rotate any credentials** that were ever real
before reusing this code in a real environment.
