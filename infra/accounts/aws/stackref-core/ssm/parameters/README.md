If the SSO/SCIM configuration with Auth0 changes:

- Re-enable Automatic Provisioning in the AWS SSO console (https://docs.aws.amazon.com/singlesignon/latest/userguide/provision-automatically.html)
- Get the SCIM Endpoint URL and Token
- Change those values as needed in `terraform.secret.tfvars`
