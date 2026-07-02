resource "aws_kms_key" "cloudtrail" {
  description             = "CloudTrail"
  deletion_window_in_days = 10

  policy = <<POLICY

 {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnableIAMUserPermissions",
      "Effect": "Allow",
      "Principal": {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "PermitCloudWatchUse",
      "Effect": "Allow",
      "Principal": {
          "Service": "logs.us-east-1.amazonaws.com"
      },
      "Action": [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
      ],
      "Resource": "*",
      "Condition": {
          "ArnEquals": {
              "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:cloudtrail/stackref-analysis-codescans"
          }
      }
    },
    {
      "Sid": "PermitCloudTrailUse",
      "Effect": "Allow",
      "Principal": {
          "Service": "cloudtrail.amazonaws.com"
      },
      "Action": [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
      ],
      "Resource": "*"
    }

  ]
}
POLICY
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}
