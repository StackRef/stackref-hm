provider "aws" {
  region  = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
    }
  }
}

terraform {
  backend "s3" {
    region  = "us-east-1"
    bucket  = "stackref-acme-terraform-state-core"
    key     = "accounts/stackref-core/team_management/terraform.tfstate"
  }
}

data "terraform_remote_state" "organization" {
  backend = "s3"

  config = {
    region  = "us-east-1"
    bucket  = "stackref-acme-terraform-state-core"
    key     = "organization/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {}

