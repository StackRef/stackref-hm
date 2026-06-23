#tfsec:ignore:aws-s3-enable-bucket-logging
resource "aws_s3_bucket" "entity_assets" {
  bucket        = "stackref-entity-assets"
  force_destroy = true

  tags = {
    Name = "stackref-entity-assets"
  }
}

resource "aws_s3_bucket_ownership_controls" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowApiBucketAccess",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "${aws_iam_role.stackref_main_api.arn}"
        },
        "Action" : [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource" : [
          "arn:aws:s3:::stackref-entity-assets",
          "arn:aws:s3:::stackref-entity-assets/*"
        ]
      },
      {
        "Sid" : "AllowProcessInvitationListLambdaAccess",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "arn:aws:iam::000000000000:role/shot_clock_lambda-dev"
        },
        "Action" : [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource" : [
          "arn:aws:s3:::stackref-entity-assets",
          "arn:aws:s3:::stackref-entity-assets/invitation_lists/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_versioning" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id

  rule {
    id     = "default"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 60
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "entity_assets" {
  bucket = aws_s3_bucket.entity_assets.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.entity_assets.key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Invitation list upload trigger to processInvitationList shot-clock function

resource "aws_s3_bucket_notification" "invitation_list" {
  bucket = aws_s3_bucket.entity_assets.id

  lambda_function {
    lambda_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:processInvitationList"
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "invitation_lists/"
  }

}
