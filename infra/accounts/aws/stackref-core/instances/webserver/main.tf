provider "aws" {
  region  = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
      environment       = var.environment
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
    bucket  = "stackref-terraform-state-core"
    key     = "services/webserver/dev/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
