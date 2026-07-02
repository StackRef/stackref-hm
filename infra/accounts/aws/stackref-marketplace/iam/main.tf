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
    bucket = "example-terraform-state-marketplace"
    key    = "accounts/stackref-marketplace/iam/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
