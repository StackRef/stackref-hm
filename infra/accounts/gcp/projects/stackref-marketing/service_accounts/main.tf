provider "google" {
  project = "stackref-marketing"
  region  = "us-east4"
}

terraform {
  required_version = ">= 1.6"

  backend "s3" {
    region = "us-east-1"
    bucket = "stackref-terraform-state-core"
    key    = "accounts/gcp/stackref-marketing/service_accounts/terraform.tfstate"
  }
}

resource "google_service_account" "google_indexer" {
  account_id   = "google-indexer"
  display_name = "google-indexer"
  description  = "Use for indexing pages with Google API"
}

resource "google_organization_iam_member" "google_indexer" {
  org_id  = "000000000000"
  role    = "roles/editor"
  member  = google_service_account.google_indexer.member
}
