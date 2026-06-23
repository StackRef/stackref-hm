provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
      "stackref:admin"  = "true"
    }
  }
}

terraform {
  required_version = ">= 1.4"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "accounts/stackref-core/umpire/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
