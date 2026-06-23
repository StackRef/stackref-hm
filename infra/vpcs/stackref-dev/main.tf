data "aws_caller_identity" "current" {
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Name              = "stackref-dev"
      environment       = "dev"
      terraform_managed = "true"
    }
  }
}

terraform {
  required_version = ">= 0.15"

  required_providers {
    aws = {
      version = ">= 3.40.0"
      source  = "hashicorp/aws"
    }
  }
  backend "s3" {
    region  = "us-east-1"
    key     = "vpcs/stackref-dev/terraform.tfstate"
    bucket  = "stackref-acme-terraform-state-core"
  }
}
