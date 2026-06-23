data "terraform_remote_state" "rds" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "databases/dev/terraform.tfstate"
    bucket = "stackref-terraform-state-core"
  }
}
