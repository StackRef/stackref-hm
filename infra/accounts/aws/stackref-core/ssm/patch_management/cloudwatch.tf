resource "aws_cloudwatch_log_group" "patch_logs" {
  name              = "patching/stackref_infra"
  retention_in_days = 90
}
