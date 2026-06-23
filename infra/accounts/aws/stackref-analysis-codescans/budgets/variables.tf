variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "notification_emails" {
  type = list(any)
  default = [
    "stackref-core@example.com"
  ]
}

variable "ec2_budget_usd" {
  type    = string
  default = "50"
}

variable "vpc_budget_usd" {
  type    = string
  default = "100"
}

variable "rds_budget_usd" {
  type    = string
  default = "100"
}

variable "cloudwatch_budget_usd" {
  type    = string
  default = "20"
}

variable "cloudtrail_budget_usd" {
  type    = string
  default = "20"
}


variable "lambda_budget_usd" {
  type    = string
  default = "20"
}

variable "elasticache_budget_usd" {
  type    = string
  default = "20"
}

variable "apigateway_budget_usd" {
  type    = string
  default = "20"
}

variable "cloudfront_budget_usd" {
  type    = string
  default = "20"
}

variable "dynamodb_budget_usd" {
  type    = string
  default = "20"
}

variable "sqs_budget_usd" {
  type    = string
  default = "20"
}

variable "cost_explorer_budget_usd" {
  type    = string
  default = "20"
}

variable "codescans_budget_usd" {
  type    = string
  default = "10"
}

variable "cost_anomaly_threshold" {
  type    = string
  default = "50"
}
