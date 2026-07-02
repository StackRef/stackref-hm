# Deployment

This is a reference walkthrough of how the StackRef HM components fit together when
deployed. It is **not** a turnkey installer — the original system ran on a specific
multi-account AWS Organizations layout, and you will need to adapt it to your own
accounts, domains, and credentials. Treat the `infra/` Terraform as a worked example
to read and adjust, not a button to press.

> Before you start, read [`SANITIZATION.md`](SANITIZATION.md). Every `example.com`,
> `000000000000`, and `YOUR_…` placeholder is something you must replace. Rotate any
> credential that was ever real.

## Prerequisites

- AWS Organizations management access, Terraform ≥ 1.5, AWS CLI.
- An Auth0 tenant.
- A PostgreSQL database (production used Aurora PostgreSQL).
- Node.js ≥ 18, Python 3.11, Docker.
- Optional: Stripe, Sentry, MUI X Pro license, Anthropic/OpenAI keys, Amazon
  Marketplace, Zoom.

Each component has its own README with component-specific detail; this page is the
suggested **order** and the glue between them.

## Suggested order

### 1. Foundational infrastructure (`infra/`)
Stand up the account structure and shared services. Roughly:
1. `infra/organization/` — AWS Organizations root and OUs.
2. `infra/accounts/aws/stackref-core/` — Route53, ACM, SES, SSO/Identity Center,
   CloudTrail, ECR, SSM parameters, the Auth0 authorizer, networking.
3. `infra/vpcs/` and `infra/databases/` — VPC(s) and the PostgreSQL cluster.
4. Supporting integrations as needed: `infra/gitlab/`, `infra/gcp/`,
   `infra/google_workspace/`, `infra/stripe/`.

For each Terraform directory: `cp terraform.tfvars.example terraform.tfvars` (and any
`terraform.secret.tfvars.example`), fill in real values, then
`terraform init && terraform plan && terraform apply`.

### 2. Identity (`auth0/`)
Configure the Auth0 tenant: applications (SPA + API + machine-to-machine), the custom
login page, and the post-login / post-user-registration Actions. Apply
`auth0/terraform/` with your tenant credentials. Note the SPA **client ID** and **API
audience** — the frontend and API need them.

### 3. Database (`database/`)
Apply the DDL to your PostgreSQL instance **in numeric order**, then optionally load
the seed data. See [`database/README.md`](../database/README.md).

### 4. REST API (`api/`)
Build each Lambda's dependencies into its payload, then apply `api/terraform/`
(API Gateway, the Lambda functions, the shared layer, IAM, caching, DNS). Configure
it to point at your database (via Secrets Manager), Auth0, and ElastiCache. See
[`api/README.md`](../api/README.md).

### 5. Realtime (`services/tator/`)
Deploy the WebSocket API and its Lambdas (`services/tator/`). Note the `wss://`
endpoint for the frontend.

### 6. Orchestration & scheduled work
- `services/kickoff/` — event start, team formation, code scans, scoring.
- `services/shot-clock/` — scheduled metering and invitation processing.
- `ai/` — build and push the code-scoring image (used by the scoring flow).

### 7. Team-account tooling
- `services/umpire/` — deployed into team accounts to stream Config/CloudTrail
  activity back to tator.
- `services/cleanup-crew/` — the `aws-nuke` image and configuration used to reset
  team accounts between events.

### 8. Frontend (`frontend/`)
```bash
cd frontend
cp .env.example .env.<env>          # Auth0 domain + SPA client ID, API URL, wss URL
npm install
npm run build --env=<env>           # outputs static assets to build/
```
Deploy `build/` to S3 + CloudFront (the production scripts in `package.json` show the
S3 sync + CloudFront invalidation pattern; point them at your own bucket/distribution).

## Configuration cheat-sheet

| What | Where it's configured |
|---|---|
| AWS account IDs | `*.tfvars` across `infra/`, `api/`, `services/*` |
| Domains | Route53 / ACM in `infra/`, plus frontend `.env` |
| Auth0 domain, client IDs, audience | `auth0/`, `frontend/.env`, API `*.tfvars` |
| DB credentials | AWS Secrets Manager (referenced by ARN/name in `*.tfvars`) |
| Integration secrets (Stripe, OpenAI, SCIM…) | SSM SecureString — see `infra/accounts/aws/stackref-core/ssm/parameters/terraform.secret.tfvars.example` |
| Frontend public config | `frontend/.env.*` |

## Teardown

Application Terraform can be destroyed per directory with `terraform destroy`. Team
accounts are reset with **cleanup-crew** (`aws-nuke`); be careful — that is
destructive by design and is scoped by `nuke-config.yml` to team resources only.
