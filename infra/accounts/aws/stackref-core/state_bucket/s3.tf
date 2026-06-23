resource "aws_s3_bucket" "stackref-terraform-state-prod" {
  bucket = "stackref-acme-terraform-state-core"
}

resource "aws_s3_bucket_versioning" "terraform_state_prod" {
  bucket = aws_s3_bucket.stackref-terraform-state-prod.id
  versioning_configuration {
    status = "Enabled"
  }
}
