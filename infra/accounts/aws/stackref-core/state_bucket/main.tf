data "aws_caller_identity" "current" {
}

provider "aws" {
  region  = var.aws_region
}

terraform {
  required_version = ">= 0.14"
}
