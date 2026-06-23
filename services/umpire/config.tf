resource "aws_config_configuration_recorder" "umpire" {
  name     = "umpire"
  role_arn = aws_iam_service_linked_role.aws_config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "umpire" {
  name           = "umpire"
  s3_bucket_name = aws_s3_bucket.stackref-core-us-east-1-umpire.bucket
  sns_topic_arn  = aws_sns_topic.umpire.arn
  depends_on = [
    aws_config_configuration_recorder.umpire,
    aws_sns_topic.umpire
  ]
}

resource "aws_config_configuration_recorder_status" "umpire" {
  name       = aws_config_configuration_recorder.umpire.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.umpire]
}

#resource "aws_config_organization_custom_rule" "team_accounts" {
#  depends_on = [
#    aws_lambda_permission.aws_config
#  ]

#  lambda_function_arn = aws_lambda_function.org_team_accounts_config_rule.arn
#  name                = "orgTeamAccounts"
#  trigger_types       = ["ConfigurationItemChangeNotification"]

#  excluded_accounts = [
#    data.aws_caller_identity.current.account_id,
#    "000000000000", # stackref-analysis-codescans
#    "000000000000"  # stackref-marketplace
#  ]
#}

resource "aws_config_configuration_aggregator" "team_accounts" {
  name = "StackRefTeamAccounts"

  account_aggregation_source {
    account_ids = [
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
      "000000000000",
    ]
    regions = ["us-east-1"]
  }
}
