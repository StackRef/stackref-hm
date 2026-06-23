# infra

Foundational infrastructure for StackRef HM, as **Terraform**. This is the layer
underneath the application: the AWS Organizations layout, networking, databases,
identity plumbing, and supporting SaaS integrations.

> **Read before you apply.** This Terraform models a specific, real multi-account AWS
> Organizations deployment. It is a **reference implementation**, not a turnkey
> install. Account IDs, domains, and credentials were replaced with placeholders
> during sanitization — see [`docs/SANITIZATION.md`](../docs/SANITIZATION.md). Review
> each module and supply your own values before running it anywhere real.

## Layout

```
infra/
├── organization/        AWS Organizations root + OUs
├── accounts/
│   ├── aws/
│   │   ├── stackref-core/             # control plane account
│   │   ├── stackref-analysis-codescans/  # isolated account for scanning team code
│   │   ├── stackref-marketplace/      # Amazon Marketplace SaaS integration
│   │   └── team-accounts/             # per-team account configuration
│   └── gcp/                           # GCP projects (marketing, core)
├── databases/           # Aurora / RDS PostgreSQL
├── vpcs/                # VPC networking
├── gitlab/              # GitLab group/project + CI integration
├── google_workspace/    # Google Workspace users/groups
└── stripe/              # Stripe products/prices
```

### `accounts/aws/stackref-core`
The control-plane account. Notable modules: `route53`, `acm`, `ses` (email), `sso`
(IAM Identity Center, including the per-team `TeamWrite-*` permission sets),
`cloudtrail`, `ecr`, `auth0_authorizer` (the API Gateway authorizer Lambda),
`team_management`, `ssm` (SecureString parameters for runtime secrets), `instances`
(bastion, GitLab runners), and `state_bucket` (Terraform remote state).

### `accounts/aws/stackref-analysis-codescans`
An isolated account where team code is scanned (`codebuild`, plus `iam`, `s3`,
`cloudtrail`, `ssm`). Keeps untrusted team code away from the control plane.

### `accounts/aws/team-accounts`
The configuration applied to each team's account: `account_alias`, `vpc`, `iam`,
`eventbridge`, `ec2`, and `event` (the per-event resources). Paired at runtime with
the [`umpire`](../services/umpire/README.md) and
[`cleanup-crew`](../services/cleanup-crew/README.md) services.

## Applying a module

Each leaf directory is an independent Terraform root with its own state:

```bash
cd infra/accounts/aws/stackref-core/route53     # for example
cp terraform.tfvars.example terraform.tfvars     # fill in real values
# if present:
cp terraform.secret.tfvars.example terraform.secret.tfvars
terraform init && terraform plan && terraform apply
```

Many modules store state in an S3 **`state_bucket`** (provisioned by the
`state_bucket/` module in each account). Stand those up first if you want remote state.

## Secrets

Runtime secrets are stored as **SSM SecureString** parameters, not in code. The set of
values you must provide is templated in
[`accounts/aws/stackref-core/ssm/parameters/terraform.secret.tfvars.example`](accounts/aws/stackref-core/ssm/parameters/terraform.secret.tfvars.example)
(Stripe keys, OpenAI key, SCIM token, etc.). The `gitlab/` and `stripe/` modules have
their own `terraform.secret.tfvars.example` templates too.

## Suggested order

See [`docs/deployment.md`](../docs/deployment.md) for the end-to-end order across all
components. Within `infra/`, roughly: `organization` → `stackref-core` (networking,
SSO, Route53, SES, SSM) → `vpcs`/`databases` → supporting integrations → team-account
configuration.
