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

resource "aws_cloudwatch_event_target" "ec2_resource_state_change_tator_event_bridge" {
  arn  = aws_lambda_function.tator_websocket_event_bridge.arn
  rule = aws_cloudwatch_event_rule.ec2_resource_state_change.name
}

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

resource "aws_cloudwatch_event_target" "tags_change_tator_event_bridge" {
  arn  = aws_lambda_function.tator_websocket_event_bridge.arn
  rule = aws_cloudwatch_event_rule.tags_change.name
}

## Team Accounts

# resource "aws_cloudwatch_event_rule" "ec2_resource_state_change_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-EC2ResourceStateChangeEvents"
#   description    = "Capture all EC2 resource change events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.ec2"],
#   "detail-type": ["EC2 Instance State-change Notification"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "ec2_resource_state_change_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-EC2ResourceStateChangeEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.ec2_resource_state_change_team_account
#   ]
# }

# resource "aws_cloudwatch_event_rule" "tags_change_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-TagEvents"
#   description    = "Capture all tag change events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.tag"],
#   "detail-type": ["Tag Change on Resource"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "tags_change_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-TagEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.tags_change_team_account
#   ]
# }

# resource "aws_cloudwatch_event_rule" "rds_instance_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-RDSInstanceEvents"
#   description    = "Capture all RDS instance events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.rds"],
#   "detail-type": ["RDS DB Instance Event"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "rds_instance_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-RDSInstanceEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.rds_instance_team_account
#   ]
# }

# resource "aws_cloudwatch_event_rule" "lambda_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-LambdaEvents"
#   description    = "Capture all Lambda modification events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.lambda"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "lambda_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-LambdaEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.lambda_team_account
#   ]
# }

# resource "aws_cloudwatch_event_rule" "dynamodb_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-DynamoDBEvents"
#   description    = "Capture all DynamoDB modification events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.dynamodb"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "dynamodb_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-DynamoDBEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.dynamodb_team_account
#   ]
# }

# resource "aws_cloudwatch_event_rule" "elasticache_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   name           = "SR-ElastiCacheEvents"
#   description    = "Capture all ElastiCache modification events"
#   event_bus_name = each.value.cloud_account_name

#   event_pattern = <<EOF
# {
#   "source": ["aws.elasticache"]
# }
# EOF
# }

# resource "aws_cloudwatch_event_target" "elasticache_team_account" {
#   for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

#   event_bus_name = each.value.cloud_account_name
#   arn            = aws_lambda_function.tator_websocket_event_bridge.arn
#   rule           = "SR-ElastiCacheEvents"

#   depends_on = [
#     aws_cloudwatch_event_rule.elasticache_team_account
#   ]
# }
