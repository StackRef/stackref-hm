# auth0

**Identity.** StackRef HM uses [Auth0](https://auth0.com/) for authentication. This
directory holds the tenant configuration: the custom login experience, the Actions
that run during login and registration, and Terraform to manage it all.

## Contents

| Path | What it is |
|---|---|
| `customLoginPage.html` | The branded Universal Login page |
| `post-login.js` | **Post-Login Action** — runs on every login; syncs the user into StackRef and applies grants/claims |
| `post-user-registration.js` | **Post-User-Registration Action** — runs when a new user signs up |
| `gitlabAuth.js` | Helper for the GitLab social connection |
| `terraform/` | Terraform managing applications, connections, and actions |

## How it fits together

- The **frontend** uses an Auth0 **SPA application** to log users in and obtain a JWT.
- The **api** and **tator** services verify that JWT (an Auth0 authorizer Lambda backs
  API Gateway — see `infra/accounts/aws/stackref-core/auth0_authorizer/`).
- A **machine-to-machine** application is used by Terraform to manage the tenant.
- The Actions keep StackRef's own user records in sync with Auth0 and attach the
  custom claims the API relies on.

## Deploying

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
cp terraform.secret.tfvars.example terraform.secret.tfvars   # fill in real secrets, never commit
terraform init
terraform plan  -var-file=terraform.tfvars -var-file=terraform.secret.tfvars
terraform apply -var-file=terraform.tfvars -var-file=terraform.secret.tfvars
```

`terraform.secret.tfvars` holds the Auth0 management credentials and the social/
enterprise identity-provider secrets (GitLab, GitHub, Google) and SES email IAM keys.
See [`terraform/terraform.secret.tfvars.example`](terraform/terraform.secret.tfvars.example)
for the full list of values you must supply.

## Configuration you'll need to set

- Tenant domain (e.g. `auth.example.com`), and the **SPA**, **API**, and **M2M**
  application client IDs/secrets.
- The API **audience** value, which the frontend and API must agree on.
- Identity-provider app credentials for any social/enterprise connections you enable.
