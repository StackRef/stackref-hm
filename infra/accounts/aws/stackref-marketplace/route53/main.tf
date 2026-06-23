provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.4"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-marketplace"
    key    = "accounts/stackref-marketplace/route53/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
