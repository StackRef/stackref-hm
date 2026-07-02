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
  required_version = ">= 1.2"

  #  required_providers {
  #    onepassword = {
  #      source  = "1Password/onepassword"
  #      version = "~> 1.1.2"
  #    }
  #  }

  backend "s3" {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "accounts/stackref-analysis-codescans/ssm/parameters/terraform.tfstate"
  }
}

#provider "onepassword" {
#  url = "http://localhost:8080"
#}

