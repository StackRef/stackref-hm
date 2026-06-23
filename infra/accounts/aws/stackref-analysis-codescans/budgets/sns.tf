data "aws_sns_topic" "email_jordan" {
  name = "email-jordan"
}

resource "aws_sns_topic" "slack_alerts" {
  name              = "stackref-core_slack_alerts"
  display_name      = "stackref-core_slack_alerts"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "chatbot_to_slack_alerts" {
  topic_arn = aws_sns_topic.slack_alerts.arn
  protocol  = "https"
  endpoint  = "https://global.sns-api.chatbot.amazonaws.com"
}

resource "aws_sns_topic_policy" "slack_alerts" {
  arn = aws_sns_topic.slack_alerts.arn
  policy = jsonencode(
    {
      Id = "__default_policy_ID"
      Statement = [
        {
          Action = [
            "SNS:Publish",
            "SNS:RemovePermission",
            "SNS:SetTopicAttributes",
            "SNS:DeleteTopic",
            "SNS:ListSubscriptionsByTopic",
            "SNS:GetTopicAttributes",
            "SNS:Receive",
            "SNS:AddPermission",
            "SNS:Subscribe"
          ]
          Condition = {
            StringEquals = {
              "AWS:SourceOwner" = data.aws_caller_identity.current.account_id
            }
          }
          Effect = "Allow"
          Principal = {
            AWS = "*"
          }
          Resource = aws_sns_topic.slack_alerts.arn
          Sid      = "default"
        },
        {
          Action = "SNS:Publish"
          Effect = "Allow"
          Principal = {
            Service = [
              "budgets.amazonaws.com",
              "costalerts.amazonaws.com"
            ]
          }
          Resource = aws_sns_topic.slack_alerts.arn
          Sid      = "AWSBudgets-notification-1"
        },
      ]
      Version = "2008-10-17"
    }
  )
}
