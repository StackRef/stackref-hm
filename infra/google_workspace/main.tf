terraform {
  required_version = ">= 1.2"

  required_providers {
    googleworkspace = {
      source  = "hashicorp/googleworkspace"
      version = "0.7.0"
    }
  }

  backend "s3" {
    region  = "us-east-1"
    profile = "stackref-core"
    bucket  = "example-terraform-state-core"
    key     = "google_workspace/example.com/terraform.tfstate"
  }
}

provider "googleworkspace" {
  credentials             = var.google_auth_key
  customer_id             = var.google_customer_id
  impersonated_user_email = var.google_user
}
