resource "aws_cloudwatch_log_group" "stackref_analysis_codescans_codebuild" {
  name              = "/stackref/analysis/codescans"
  retention_in_days = 30
  #kms_key_id        = aws_kms_key.cloudtrail.arn
}
