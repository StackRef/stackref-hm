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

  required_providers {
    gitlab = {
      source  = "gitlabhq/gitlab"
      version = "3.14.0"
    }
  }

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "gitlab/stackref/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}

provider "gitlab" {
  token = var.gitlab_token
}
