# auth0/terraform

Terraform that manages the Auth0 tenant (applications, connections, and actions).

## Setup

Create a **Machine-to-Machine application** in your Auth0 tenant authorized for the
**Auth0 Management API**, and grant it the scopes Terraform needs. You'll find its
client ID/secret on its settings page in the Auth0 dashboard:

```
https://manage.auth0.com/dashboard/us/<your-tenant>/applications/<m2m-client-id>/settings
```

Put those values (and the other identity-provider secrets) into
`terraform.secret.tfvars` — copy [`terraform.secret.tfvars.example`](terraform.secret.tfvars.example)
and fill it in. **Never commit the real file.**

## Apply

```bash
cp terraform.tfvars.example terraform.tfvars
cp terraform.secret.tfvars.example terraform.secret.tfvars   # fill in real values
terraform init
terraform plan  -var-file=terraform.tfvars -var-file=terraform.secret.tfvars
terraform apply -var-file=terraform.tfvars -var-file=terraform.secret.tfvars
```

See the parent [`auth0/README.md`](../README.md) for how this fits into the wider
identity setup.
