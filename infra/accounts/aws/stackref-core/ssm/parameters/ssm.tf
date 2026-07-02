#data "onepassword_vault" "stackref" {
#  name = "StackRef"
#}

# You can retrieve the UUID via copying the private URL for the 1Password item and copying what comes after `&i=`
#data "onepassword_item" "aws_scim_url" {
#  vault = var.stackref_vault
#  title = "w4qmtmfluazvam257ipoelybcy"
#}

#data "onepassword_item" "aws_scim_token" {
#  vault = var.stackref_vault
#  uuid  = "6utstimiohx4qza2jjgfgiro6i"
#}

resource "aws_ssm_parameter" "aws_scim_url" {
  name  = "/stackref/aws/accounts/stackref-core/scim_url"
  type  = "String"
  value = sensitive(var.aws_scim_url)
  #  value = sensitive(onepassword_item.aws_scim_url.password)
}

resource "aws_ssm_parameter" "aws_scim_token" {
  name  = "/stackref/aws/accounts/stackref-core/scim_token"
  type  = "SecureString"
  value = sensitive(var.aws_scim_token)
  #  value = sensitive(onepassword_item.aws_scim_token.password)
}

resource "aws_ssm_parameter" "stripe_api_key_dev" {
  name  = "/stackref/stripe/dev/api_key"
  type  = "SecureString"
  value = sensitive(var.stripe_api_key_dev)
}

resource "aws_ssm_parameter" "stripe_endpoint_secret_dev" {
  name  = "/stackref/stripe/dev/endpoint_secret"
  type  = "SecureString"
  value = sensitive(var.stripe_endpoint_secret_dev)
}

resource "aws_ssm_parameter" "stripe_api_key_prod" {
  name  = "/stackref/stripe/prod/api_key"
  type  = "SecureString"
  value = sensitive(var.stripe_api_key_prod)
}

resource "aws_ssm_parameter" "stripe_endpoint_secret_prod" {
  name  = "/stackref/stripe/prod/endpoint_secret"
  type  = "SecureString"
  value = sensitive(var.stripe_endpoint_secret_prod)
}

resource "aws_ssm_parameter" "openai_api_key" {
  name  = "/stackref/openai/openai_api_key"
  type  = "SecureString"
  value = sensitive(var.openai_api_key)
}
