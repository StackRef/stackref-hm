provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
    }
  }
}

terraform {
  required_version = ">= 1.2"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-codescans"
    key    = "accounts/stackref-analysis-codescans/cloudwatch/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
