provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      environment       = var.environment
      terraform_managed = "true"
      sr_api_version    = var.sr_api_version
    }
  }
}

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      version = ">= 3.66"
      source  = "hashicorp/aws"
    }
    archive = {
      version = ">= 2.2"
      source  = "hashicorp/archive"
    }
    null = {
      version = ">= 3.1"
      source  = "hashicorp/null"
    }
  }

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "api/stackref_main/terraform.tfstate"
  }
}

data "terraform_remote_state" "tator" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "accounts/stackref-core/tator/terraform.tfstate"
  }
}

data "terraform_remote_state" "kickoff" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "accounts/stackref-core/kickoff/terraform.tfstate"
  }
}

data "terraform_remote_state" "auth0" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "auth0/dev/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}
