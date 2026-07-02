resource "aws_s3_bucket" "stackref-core-us-east-1-cloudtrail" {
  bucket        = "stackref-acme-us-east-1-cloudtrail"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "stackref_core_cloudtrail" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "arn:aws:s3:::stackref-acme-us-east-1-cloudtrail"
        },
        {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::stackref-acme-us-east-1-cloudtrail/*",
            "Condition": {
                "StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        }
    ]
  })
}

# resource "aws_s3_bucket_acl" "stackref_core_cloudtrail" {
#   bucket = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id
#   acl    = "private"
# }

resource "aws_s3_bucket_versioning" "stackref_core_cloudtrail" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "stackref_core_cloudtrail" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id

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

resource "aws_s3_bucket_server_side_encryption_configuration" "stackref_core_cloudtrail" {
  bucket = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.key_id
      sse_algorithm     = "aws:kms"
    }
  }
}
