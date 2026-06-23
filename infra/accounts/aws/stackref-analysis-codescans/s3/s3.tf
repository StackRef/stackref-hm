resource "aws_s3_bucket" "stackref-team-analysis-results" {
  bucket = "stackref-acme-team-analysis-results"
}

# resource "aws_s3_bucket_acl" "stackref-team-analysis-results" {
#   bucket = aws_s3_bucket.stackref-team-analysis-results.id
#   acl    = "private"
# }

resource "aws_s3_bucket_server_side_encryption_configuration" "stackref-team-analysis-results" {
  bucket = aws_s3_bucket.stackref-team-analysis-results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.analysis_results.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "stackref-team-analysis-results" {
  bucket = aws_s3_bucket.stackref-team-analysis-results.id
  policy = <<POLICY
{
  "Version": "2008-10-17",
  "Id": "PolicyForCodeScanAccess",
  "Statement": [
      {
          "Sid": "AllowCodeBuildAccess",
          "Effect": "Allow",
          "Principal": {
              "Service": "codebuild.amazonaws.com"
          },
          "Action": [
            "s3:Get*",
            "s3:Put*"
          ],
          "Resource": "arn:aws:s3:::stackref-acme-team-analysis-results/*",
          "Condition": {
              "StringEquals": {
                "AWS:SourceAccount": "${data.aws_caller_identity.current.account_id}"
              }
          }
      },
      {
          "Sid": "AllowStackRefCoreLambdaAccess",
          "Effect": "Allow",
          "Principal": {
              "AWS": [
                "arn:aws:iam::${var.sr_core_account_id}:role/kickoff_lambda"
              ]
          },
          "Action": [
            "s3:Get*"
          ],
          "Resource": "arn:aws:s3:::stackref-acme-team-analysis-results/*"
      }
  ]
}
POLICY
}

resource "aws_s3_bucket_lifecycle_configuration" "stackref-team-analysis-results" {
  bucket = aws_s3_bucket.stackref-team-analysis-results.id

  rule {
    id     = "default"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

#resource "aws_s3_bucket_notification" "record_analysis_results" {
#  bucket = aws_s3_bucket.stackref-team-analysis-results.id

#  lambda_function {
#    #lambda_function_arn = aws_lambda_function.record_analysis_results.arn
#    id                  = "lambdaKickoffRecordResults"
#    lambda_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:kickoffRecordResults"
#    events              = ["s3:ObjectCreated:*"]
#    filter_prefix       = "codescan_results/"
#    filter_suffix       = ".json"
#  }

#}
