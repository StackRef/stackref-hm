provider "aws" {
  profile = "stackref-core"
  region  = var.aws_region

  default_tags {
    tags = {
      environment       = var.environment
      terraform_managed = "true"
    }
  }
}

terraform {
  required_version = ">= 1.0"

  backend "s3" {
    profile = "stackref-core"
    region  = "us-east-1"
    bucket  = "stackref-terraform-state-core"
    key     = "accounts/stackref-core/primary_frontend/beta/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}

module "primary_frontend" {
  source = "../module"

  environment       = var.environment
  api_version       = var.api_version
  allowed_countries = var.allowed_countries
}
