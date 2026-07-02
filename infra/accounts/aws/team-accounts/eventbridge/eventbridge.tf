## EC2

resource "aws_cloudwatch_event_rule" "ec2_resource_state_change" {
  name        = "SR-EC2ResourceStateChangeEvents"
  description = "Capture all EC2 resource change events"

  event_pattern = <<EOF
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"]
}
EOF
}

resource "aws_cloudwatch_event_target" "ec2_resource_state_change" {
  target_id = "SR-EC2StateChangeEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.ec2_resource_state_change.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}

## Tags

resource "aws_cloudwatch_event_rule" "tags_change" {
  name          = "SR-TagEvents"
  description   = "Capture all tag change events"
  event_pattern = <<EOF
{
  "source": ["aws.tag"],
  "detail-type": ["Tag Change on Resource"]
}
EOF
}

resource "aws_cloudwatch_event_target" "tags_change" {
  target_id = "SR-TagEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.tags_change.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}

## RDS

resource "aws_cloudwatch_event_rule" "rds_instance" {
  name        = "SR-RDSInstanceEvents"
  description = "Capture all RDS instance events"

  event_pattern = <<EOF
{
  "source": ["aws.rds"],
  "detail-type": ["RDS DB Instance Event"]
}
EOF
}

resource "aws_cloudwatch_event_target" "rds_instance" {
  target_id = "SR-RDSInstanceEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.rds_instance.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}

## Lambda

resource "aws_cloudwatch_event_rule" "lambda" {
  name        = "SR-LambdaEvents"
  description = "Capture all Lambda modification events"

  event_pattern = <<EOF
{
  "source": ["aws.lambda"]
}
EOF
}

resource "aws_cloudwatch_event_target" "lambda" {
  target_id = "SR-LambdaEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.lambda.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}

## DynamoDB

resource "aws_cloudwatch_event_rule" "dynamodb" {
  name        = "SR-DynamoDBEvents"
  description = "Capture all DynamoDB modification events"

  event_pattern = <<EOF
{
  "source": ["aws.dynamodb"]
}
EOF
}

resource "aws_cloudwatch_event_target" "dynamodb" {
  target_id = "SR-DynamoDBEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.dynamodb.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}

## ElastiCache

resource "aws_cloudwatch_event_rule" "elasticache" {
  name        = "SR-ElastiCacheEvents"
  description = "Capture all ElastiCache modification events"

  event_pattern = <<EOF
{
  "source": ["aws.elasticache"]
}
EOF
}

resource "aws_cloudwatch_event_target" "elasticache" {
  target_id = "SR-ElastiCacheEvents"
  arn       = "arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"
  rule      = aws_cloudwatch_event_rule.elasticache.name
  role_arn  = aws_iam_role.event_bus_invoke_remote_team_event_bus.arn
}
