provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Name              = "bastion-${var.environment}"
      application       = "bastion"
      environment       = var.environment
      terraform_managed = "true"
    }
  }
}

terraform {
  required_version = ">= 1.2"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-acme-terraform-state-core"
    key    = "accounts/stackref-core/instances/dev/bastion/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
