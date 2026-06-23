resource "aws_s3_bucket" "stackref-terraform-state" {
  bucket = "stackref-terraform-state-codescans"
}

resource "aws_s3_bucket_acl" "terraform_state" {
  bucket = aws_s3_bucket.stackref-terraform-state.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.stackref-terraform-state.id
  versioning_configuration {
    status = "Enabled"
  }
}
