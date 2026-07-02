resource "aws_sns_topic" "email_jordan" {
  name              = "email-jordan"
  display_name      = "email-jordan"
  #kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "demo_stackref_com" {
  topic_arn = aws_sns_topic.email_jordan.arn
  protocol  = "email"
  endpoint  = "admin@example.com"
}

resource "aws_sns_topic_policy" "email_jordan" {
  arn = aws_sns_topic.email_jordan.arn
  policy = jsonencode(
    {
      Id = "__default_policy_ID"
      Statement = [
        {
          Action = [
            "SNS:GetTopicAttributes",
            "SNS:SetTopicAttributes",
            "SNS:AddPermission",
            "SNS:RemovePermission",
            "SNS:DeleteTopic",
            "SNS:Subscribe",
            "SNS:ListSubscriptionsByTopic",
            "SNS:Publish"
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
          Resource = aws_sns_topic.email_jordan.arn
          Sid      = "default"
        }
      ]
      Version = "2008-10-17"
    }
  )
}
