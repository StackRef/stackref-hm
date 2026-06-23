provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
      environment       = var.environment
    }
  }
}

terraform {
  required_version = ">= 1.1"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "accounts/stackref-core/ses/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
