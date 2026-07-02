terraform {
  required_version = ">= 1.0"

  required_providers {
    awscc = {
      source  = "hashicorp/awscc"
      version = "~> 0.1"
    }
  }

  backend "s3" {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "accounts/stackref-core/budgets/terraform.tfstate"
  }
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

provider "awscc" {
  region = "us-east-1"
}

data "aws_caller_identity" "current" {
}
