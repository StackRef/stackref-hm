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

resource "aws_ssm_parameter" "snyk_token" {
  name  = "/integrations/snyk/api_token"
  type  = "SecureString"
  value = var.snyk_token
}

resource "aws_ssm_parameter" "infracost_api_key" {
  name  = "/integrations/infracost/api_key"
  type  = "SecureString"
  value = var.infracost_api_key
}

resource "aws_ssm_parameter" "cody_api_url" {
  name  = "/integrations/cody/api_url"
  type  = "String"
  value = var.cody_api_url
}

resource "aws_ssm_parameter" "cody_api_token" {
  name  = "/integrations/cody/api_token"
  type  = "SecureString"
  value = var.cody_api_token
}

resource "aws_ssm_parameter" "openai_apikey" {
  name  = "/integrations/openai/api_key"
  type  = "SecureString"
  value = var.openai_api_key
}
