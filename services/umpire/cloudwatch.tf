resource "aws_cloudwatch_log_subscription_filter" "cloudtrail_referee_create_modify" {
  name            = "umpire_create"
  log_group_name  = "cloudtrail/stackref-acme"
  filter_pattern  = "?CreateApi ?CreateBu ?CreateCa ?CreateDB ?CreateRe ?CreateTab ?CreateVol ?Mod ?RunIn"
  destination_arn = aws_lambda_function.umpire.arn
}

resource "aws_cloudwatch_log_subscription_filter" "cloudtrail_referee_delete" {
  name            = "umpire_delete"
  log_group_name  = "cloudtrail/stackref-acme"
  filter_pattern  = "?DeleteApi ?DeleteBu ?DeleteCa ?DeleteDB ?DeleteRe ?DeleteTab ?DeleteR ?DeleteVol ?Term"
  destination_arn = aws_lambda_function.umpire.arn
}
