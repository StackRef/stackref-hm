provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      terraform_managed = "true"
      sr_tator_version  = var.sr_tator_version
    }
  }
}

terraform {
  required_version = ">= 1.2"

  backend "s3" {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "accounts/stackref-core/tator/terraform.tfstate"
  }
}

data "aws_caller_identity" "current" {
}

data "terraform_remote_state" "organization" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "organization/terraform.tfstate"
  }
}

data "terraform_remote_state" "auth0" {
  backend = "s3"

  config = {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "auth0/dev/terraform.tfstate"
  }
}
