resource "aws_s3_bucket" "entity_assets" {
  for_each = var.entity_asset_buckets

  bucket        = "${each.key}-entity-assets"
  force_destroy = true

  tags = {
    Name        = "${each.key}-entity-assets"
    environment = each.value.environment
  }
}

resource "aws_s3_bucket_policy" "entity_assets" {
  for_each = var.entity_asset_buckets

  bucket = aws_s3_bucket.entity_assets[each.key].id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowApiBucketAccess",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "${var.stackref_main_api_lambda_role}"
        },
        "Action" : [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource" : [
          "arn:aws:s3:::${each.key}-entity-assets",
          "arn:aws:s3:::${each.key}-entity-assets/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_versioning" "entity_assets" {
  for_each = var.entity_asset_buckets

  bucket = aws_s3_bucket.entity_assets[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "stackref_core_cloudtrail" {
  for_each = var.entity_asset_buckets

  bucket = aws_s3_bucket.entity_assets[each.key].id

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

resource "aws_s3_bucket_server_side_encryption_configuration" "stackref_core_cloudtrail" {
  for_each = var.entity_asset_buckets

  bucket = aws_s3_bucket.entity_assets[each.key].id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.entity_assets[each.key].key_id
      sse_algorithm     = "aws:kms"
    }
  }
}
