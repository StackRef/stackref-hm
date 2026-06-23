provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.2"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "accounts/stackref-core/auth0_authorizer/terraform.tfstate"
  }
}

data "terraform_remote_state" "auth0" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "auth0/dev/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
