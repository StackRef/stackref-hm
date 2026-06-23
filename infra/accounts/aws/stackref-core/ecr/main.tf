provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Name              = "stackref-${var.environment}"
      environment       = var.environment
      terraform_managed = "true"
    }
  }
}

terraform {
  required_version = ">= 1.0"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "accounts/stackref-core/ecr/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
