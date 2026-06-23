resource "aws_cloudwatch_log_group" "stackref-analysis-codescans-cloudtrail" {
  name              = "cloudtrail/stackref-analysis-codescans"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudtrail.arn
}
