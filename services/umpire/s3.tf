resource "aws_s3_bucket" "stackref-core-us-east-1-umpire" {
  bucket        = "stackref-acme-us-east-1-umpire"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "stackref-core-us-east-1-umpire" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-umpire.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AWSConfigBucketPermissionsCheck",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "config.amazonaws.com"
        },
        "Action" : "s3:GetBucketAcl",
        "Resource" : "arn:aws:s3:::stackref-acme-us-east-1-umpire",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceAccount" : "${data.aws_caller_identity.current.account_id}"
          }
        }
      },
      {
        "Sid" : "AWSConfigBucketExistenceCheck",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "config.amazonaws.com"
        },
        "Action" : "s3:ListBucket",
        "Resource" : "arn:aws:s3:::stackref-acme-us-east-1-umpire",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceAccount" : "${data.aws_caller_identity.current.account_id}"
          }
        }
      },
      {
        "Sid" : "AWSConfigBucketDelivery",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "config.amazonaws.com"
        },
        "Action" : "s3:PutObject",
        "Resource" : "arn:aws:s3:::stackref-acme-us-east-1-umpire/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*",
        "Condition" : {
          "StringEquals" : {
            "s3:x-amz-acl" : "bucket-owner-full-control",
            "AWS:SourceAccount" : "${data.aws_caller_identity.current.account_id}"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "stackref-core-us-east-1-umpire" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-umpire.id

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

resource "aws_s3_bucket_server_side_encryption_configuration" "stackref-core-us-east-1-umpire" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-umpire.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
