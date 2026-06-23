data "archive_file" "tator_websocket_disconnect_lambda_payload" {
  type        = "zip"
  source_dir  = var.tator_websocket_disconnect_lambda_src_dir
  output_path = "${var.tator_websocket_disconnect_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "tator_websocket_disconnect" {
  filename         = data.archive_file.tator_websocket_disconnect_lambda_payload.output_path
  function_name    = "tatorWebsocketDisconnect"
  description      = "Processes disconnections for Tator websocket service"
  role             = aws_iam_role.tator_websocket_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.tator_websocket_disconnect_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10
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
      SR_TATOR_VERSION         = var.sr_tator_version
      SR_DB_NAME               = var.sr_db_name
      SR_DB_SECRET_ARN         = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP      = data.aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL         = var.sr_logging_level
      SR_AUTH0_DOMAIN          = var.sr_auth0_domain
      SR_AUTH0_CLIENT_ID       = var.sr_auth0_client_id
      SR_AUTH0_CLIENT_IDS      = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE     = var.sr_auth0_be_audience
      SR_CONNECTIONS_DDB_TABLE = "tator_ws_connections_${var.environment}"
      SR_ROOMS_DDB_TABLE       = "tator_ws_rooms_${var.environment}"
      SR_WEBSOCKET_EP          = "ws.acme.example.com"
    }
  }
}

resource "aws_lambda_permission" "tator_websocket_disconnect_api" {
  statement_id  = "AllowAPIInvoke-tatorWebsocketDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tator_websocket_disconnect.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.tator_websocket.execution_arn}/*/*/*"
}
