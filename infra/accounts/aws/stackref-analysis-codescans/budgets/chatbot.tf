resource "awscc_chatbot_slack_channel_configuration" "aws_notifications" {
  configuration_name = "stackref-core_slack_alerts"
  iam_role_arn       = "arn:aws:iam::${data.aws_caller_identity.current.id}:role/service-role/AWSChatbot"
  slack_channel_id   = "C02BMJY9GS3" # aws_notifications
  slack_workspace_id = "T01F7KK4YKU"

  guardrail_policies = [
    "arn:aws:iam::${data.aws_caller_identity.current.id}:policy/service-role/AWS-Chatbot-NotificationsOnly-Policy-5b9f1266-bdec-447e-9c7e-a0373ee5854e"
  ]

  sns_topic_arns = [
    aws_sns_topic.slack_alerts.arn
  ]

  logging_level = "ERROR"
}
