# Contributing to StackRef HM

Thanks for your interest! StackRef Hackathon Manager was originally a
commercial SaaS product and is now released as-is under the Apache-2.0
license. It is a large, multi-service codebase; contributions of any size are
welcome.

## Ground rules

- **Never commit secrets.** No real credentials, account IDs, API keys, private
  keys, `.env` files, or Terraform state. The root `.gitignore` blocks the
  common offenders; double-check your diff before pushing.
- Use `*.example` files for configuration templates. Real values stay local.
- Keep changes scoped to one component where possible (see the component map in
  the root [README](README.md)).

## Repository layout

This is a monorepo. Each top-level directory is an independently deployable
component with its own README and configuration. See
[`docs/architecture.md`](docs/architecture.md) for how they fit together.

## Development

Each component documents its own setup:

- `frontend/` — Node 18+, `npm install`, `npm start`
- `api/`, `services/*/` — Python 3.11 Lambdas; see each `requirements.txt`
- `database/` — PostgreSQL DDL, applied in numeric order
- `infra/`, `auth0/` — Terraform; review before `apply`

## Re-running the sanitization

The scripts under [`scripts/`](scripts/) (`build_monorepo.sh`, `scrub.py`)
document how this public tree was produced from the original private repos and
can be re-run or audited. `python3 scripts/scrub.py . --check` reports any
identifying values still present.

## Submitting changes

1. Fork and branch from `main`.
2. Make your change with a clear commit message.
3. Open a pull request describing the what and why.

By contributing, you agree that your contributions are licensed under the
Apache License 2.0.
