resource "aws_budgets_budget" "ec2" {
  name_prefix       = "budget-ec2-monthly-"
  budget_type       = "COST"
  limit_amount      = var.ec2_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2020-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Elastic Compute Cloud - Compute",
      "Amazon Elastic Block Store",
      "Amazon Elastic Load Balancing"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "vpc" {
  name_prefix       = "budget-vpc-monthly-"
  budget_type       = "COST"
  limit_amount      = var.vpc_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2020-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Virtual Private Cloud",
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "rds" {
  name_prefix       = "budget-rds-monthly-"
  budget_type       = "COST"
  limit_amount      = var.rds_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2020-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Relational Database Service",
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "cloudwatch" {
  name_prefix       = "budget-cloudwatch-monthly-"
  budget_type       = "COST"
  limit_amount      = var.cloudwatch_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "CloudWatch",
      "CloudWatch Events"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "cloudtrail" {
  name_prefix       = "budget-cloudtrail-monthly-"
  budget_type       = "COST"
  limit_amount      = var.cloudtrail_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "CloudTrail"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "lambda" {
  name_prefix       = "budget-lambda-monthly-"
  budget_type       = "COST"
  limit_amount      = var.lambda_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Lambda"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "elasticache" {
  name_prefix       = "budget-elasticache-monthly-"
  budget_type       = "COST"
  limit_amount      = var.elasticache_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "ElastiCache"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "apigateway" {
  name_prefix       = "budget-apigateway-monthly-"
  budget_type       = "COST"
  limit_amount      = var.apigateway_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "API Gateway"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "cloudfront" {
  name_prefix       = "budget-cloudfront-monthly-"
  budget_type       = "COST"
  limit_amount      = var.cloudfront_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "CloudFront"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "dynamodb" {
  name_prefix       = "budget-dynamodb-monthly-"
  budget_type       = "COST"
  limit_amount      = var.dynamodb_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "DynamoDB"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "sqs" {
  name_prefix       = "budget-sqs-monthly-"
  budget_type       = "COST"
  limit_amount      = var.sqs_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "SQS"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "cost_explorer" {
  name_prefix       = "budget-cost-explorer-monthly-"
  budget_type       = "COST"
  limit_amount      = var.cost_explorer_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2022-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Cost Explorer"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}

resource "aws_budgets_budget" "codescans" {
  name_prefix       = "budget-codescans-monthly-"
  budget_type       = "COST"
  limit_amount      = var.codescans_budget_usd
  limit_unit        = "USD"
  time_period_end   = "2087-06-15_00:00"
  time_period_start = "2023-03-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "CodeCommit",
      "CodeBuild"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.notification_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.slack_alerts.arn]
  }
}
