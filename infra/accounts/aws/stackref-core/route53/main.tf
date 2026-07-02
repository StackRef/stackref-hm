provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.2"

  backend "s3" {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "accounts/stackref-core/route53/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
