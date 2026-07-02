terraform {
  required_version = ">= 1.1"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "0.42.0"
    }
  }

  backend "s3" {
    region  = "us-east-1"
    profile = "acme"
    bucket  = "example-terraform-state-core"
    key     = "auth0/dev/terraform.tfstate"
  }
}

provider "auth0" {
  domain        = var.tf_auth0_domain
  client_id     = var.tf_auth0_client_id
  client_secret = var.tf_auth0_client_secret
}
