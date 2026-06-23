data "archive_file" "tator_websocket_event_bridge_lambda_payload" {
  type       = "zip"
  source_dir = var.tator_websocket_event_bridge_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.tator_websocket_event_bridge_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "tator_websocket_event_bridge" {
  filename         = data.archive_file.tator_websocket_event_bridge_lambda_payload.output_path
  function_name    = "tatorWebsocketEventBridge"
  description      = "Processes messaging from EventBridge and Umpire to Tator websocket service"
  role             = aws_iam_role.tator_event_bridge_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.tator_websocket_event_bridge_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 120
  publish          = "true"
  architectures    = ["arm64"]

  layers = [data.aws_lambda_layer_version.python_lambda_layer.arn]

  vpc_config {
    subnet_ids = [
      data.terraform_remote_state.vpc.outputs.private_subnet_a


    ]
    security_group_ids = [data.aws_security_group.memcached_private.id]
  }

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SR_TATOR_VERSION                = var.sr_tator_version
      SR_DB_NAME                      = var.sr_db_name
      SR_DB_SECRET_ARN                = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP             = data.aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL                = var.sr_logging_level
      SR_AUTH0_DOMAIN                 = var.sr_auth0_domain
      SR_AUTH0_CLIENT_IDS             = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE            = var.sr_auth0_be_audience
      SR_CONNECTIONS_DDB_TABLE        = "tator_ws_connections_${var.environment}"
      SR_ROOMS_DDB_TABLE              = "tator_ws_rooms_${var.environment}"
      SR_ROOM_NOTIFICATIONS_DDB_TABLE = "tator_room_notifications_${var.environment}"
      SR_USER_NOTIFICATIONS_DDB_TABLE = "tator_user_notifications_${var.environment}"
      SR_WEBSOCKET_EP                 = "ws.acme.example.com"
      SR_TATOR_SQS_URL                = aws_sqs_queue.tator.url
    }
  }
}

resource "aws_lambda_permission" "ec2_resource_state_change_tator_websocket_event_bridge" {
  statement_id  = "AllowEventBridgeInvoke-ec2StateChangeTatorWebsocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tator_websocket_event_bridge.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_resource_state_change.arn
}

resource "aws_lambda_permission" "tags_change_tator_websocket_event_bridge" {
  statement_id  = "AllowEventBridgeInvoke-tagsChangeTatorWebsocket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tator_websocket_event_bridge.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.tags_change.arn
}

## Team Accounts

resource "aws_lambda_permission" "team_accounts_tator_websocket_event_bridge" {
  for_each = { for team_account in data.terraform_remote_state.organization.outputs.account_details[*] : team_account.cloud_account_cloud_id => team_account }

  statement_id  = "AllowEventBridgeInvoke-TatorWebsocket-${each.value.cloud_account_name}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tator_websocket_event_bridge.arn
  principal     = "events.amazonaws.com"
  source_arn    = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/${each.value.cloud_account_name}/SR-*"
}
