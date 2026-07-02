resource "aws_kms_key" "analysis_results" {
  description             = "StackRef Code Analysys Results"
  deletion_window_in_days = 10
}

resource "aws_kms_alias" "analysis_results" {
  name          = "alias/sr-analysis-results"
  target_key_id = aws_kms_key.analysis_results.key_id
}

resource "aws_kms_key_policy" "analysis_results" {
  key_id = aws_kms_key.analysis_results.id
  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Id": "key-default-1",
    "Statement": [
        {
            "Sid": "AllowCurrentAccount",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
            },
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "AllowStacRefCoreAccount",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::${var.sr_core_account_id}:root"
            },
            "Action": "kms:*",
            "Resource": "*"
        }
    ]
}
POLICY
}
