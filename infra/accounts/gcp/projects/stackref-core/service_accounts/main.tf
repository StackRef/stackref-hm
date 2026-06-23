provider "google" {
  project = "stackref-core-gcp"
  region  = "us-east4"
}

terraform {
  required_version = ">= 1.6"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "accounts/gcp/stackref-core/service_accounts/terraform.tfstate"
  }
}

resource "google_service_account" "terraform" {
  account_id   = "terraform"
  display_name = "terraform"
  description  = "For use with Terraform"
}
