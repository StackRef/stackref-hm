data "aws_caller_identity" "current" {
}

provider "aws" {
  region = var.aws_region

  # May need to comment out on first apply to not hit errors
  # See: https://github.com/hashicorp/terraform-provider-aws/issues/19583
  default_tags {
    tags = {
      terraform_managed = "true"
      "stackref:admin"  = "true"
    }
  }
}

terraform {
  required_version = ">= 1.5"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "organization/terraform.tfstate"
  }
}

resource "aws_organizations_organization" "stackref" {
  aws_service_access_principals = [
    "access-analyzer.amazonaws.com",
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "member.org.stacksets.cloudformation.amazonaws.com",
    "sso.amazonaws.com",
    "compute-optimizer.amazonaws.com",
    "config-multiaccountsetup.amazonaws.com"
  ]

  enabled_policy_types = [
    "SERVICE_CONTROL_POLICY",
  ]

  feature_set = "ALL"
}
