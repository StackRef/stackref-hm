resource "aws_s3_bucket" "stackref-terraform-state-marketplace" {
  bucket = "stackref-terraform-state-marketplace"
}

resource "aws_s3_bucket_versioning" "terraform_state_marketplace" {
  bucket = aws_s3_bucket.stackref-terraform-state-marketplace.id
  versioning_configuration {
    status = "Enabled"
  }
}
