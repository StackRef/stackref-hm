terraform {
  required_version = ">= 1.6"

  backend "s3" {
    region = "us-east-1"
    bucket = "example-terraform-state-core"
    key    = "accounts/gcp/stackref-core/instances/dev/endzone/terraform.tfstate"
  }
}

provider "google" {
  project = "stackref-core-gcp"
  region  = "us-east4"
}
