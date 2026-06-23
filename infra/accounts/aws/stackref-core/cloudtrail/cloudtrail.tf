resource "aws_cloudtrail" "stackref-core" {
  name                          = "stackref-core"
  s3_bucket_name                = aws_s3_bucket.stackref-core-us-east-1-cloudtrail.id
  include_global_service_events = true
  is_organization_trail         = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  cloud_watch_logs_role_arn     = aws_iam_role.cloudwatch.arn
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.stackref-core-cloudtrail.arn}:*"

  kms_key_id = aws_kms_key.cloudtrail.arn

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

}
