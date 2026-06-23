provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      environment       = var.environment
      terraform_managed = "true"
      "stackref:admin"  = "true"
    }
  }
}

terraform {
  required_version = ">= 1.4"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-marketplace"
    key    = "accounts/stackref-marketplace/marketplace-saas/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
