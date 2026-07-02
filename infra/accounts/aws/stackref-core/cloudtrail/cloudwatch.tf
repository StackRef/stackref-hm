resource "aws_cloudwatch_log_group" "stackref-core-cloudtrail" {
  name              = "cloudtrail/stackref-core"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudtrail.arn
}
