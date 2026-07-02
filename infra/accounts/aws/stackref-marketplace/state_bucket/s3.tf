resource "aws_s3_bucket" "terraform_state" {
  bucket = "example-terraform-state-marketplace"
}

resource "aws_s3_bucket_versioning" "terraform_state_marketplace" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}
