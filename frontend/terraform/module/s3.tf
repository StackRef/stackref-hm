resource "aws_s3_bucket" "env_stackref_com" {
  bucket = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "env_stackref_com" {
  bucket = aws_s3_bucket.env_stackref_com.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "env_stackref_com" {
  bucket = aws_s3_bucket.env_stackref_com.id
  policy = jsonencode({
    "Version" : "2008-10-17",
    "Id" : "PolicyForCloudFrontPrivateContent",
    "Statement" : [
      {
        "Sid" : "AllowCloudFrontServicePrincipal",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "cloudfront.amazonaws.com"
        },
        "Action" : "s3:GetObject",
        "Resource" : "arn:aws:s3:::${var.environment == "prod" ? "app" : var.environment}.acme.example.com/*",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceArn" : "${aws_cloudfront_distribution.primary_frontend.arn}"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_acl" "env_stackref_com" {
  bucket = aws_s3_bucket.env_stackref_com.id
  acl    = "private"
}

resource "aws_s3_bucket" "env_stackref_com_logs" {
  bucket = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com-logs"
}

resource "aws_s3_bucket_lifecycle_configuration" "env_stackref_com_logs" {
  bucket = aws_s3_bucket.env_stackref_com_logs.id

  rule {
    id     = "default"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "env_stackref_com_logs" {
  bucket = aws_s3_bucket.env_stackref_com_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "env_stackref_com" {
  bucket = aws_s3_bucket.env_stackref_com.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_ownership_controls" "env_stackref_com_logs" {
  bucket = aws_s3_bucket.env_stackref_com_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}
