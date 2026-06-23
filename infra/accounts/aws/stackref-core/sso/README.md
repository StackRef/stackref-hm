Instructions for setting up AWS SSO with Auth0 followed from https://jswheeler.medium.com/integrating-aws-sso-with-auth0-a9b66f7a7a00

Can also follow these instructions: https://auth0.com/docs/authenticate/protocols/saml/saml-sso-integrations/configure-auth0-saml-identity-provider/configure-saml2-web-app-addon-for-aws

If the Auth0-to-AWS application in Auth0 ever changes and needs to be redeployed here, you will need to re-enable
"Automatic Provisioning" in the SSO dashboard. Once done, record the SCIM Endpoint URL and Token. These values will then need
to be updated in the `terraform` repo in `accounts/aws/stackref-core/ssm/parameters/terraform.secret.tfvars` file and applied.

See: https://docs.aws.amazon.com/singlesignon/latest/userguide/provision-automatically.html

**If using Auth0 custom domain:** When downloading the identity metadata file, change all references of "example.us.auth0.com" to "auth.example.com"

NOTE: Unfortunately, a lot of the work setting it up cannot be done with Terraform alone. The initial setup must be completed, then
used as Terraform data provider inputs to setup permission sets.
