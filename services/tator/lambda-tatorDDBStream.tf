data "archive_file" "tator_ddb_stream_lambda_payload" {
  type       = "zip"
  source_dir = var.tator_ddb_stream_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.tator_ddb_stream_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "tator_ddb_stream" {
  filename         = data.archive_file.tator_ddb_stream_lambda_payload.output_path
  function_name    = "tatorDDBStream"
  description      = "Processes messaging from DynamoDB table(s) to Tator websocket service"
  role             = aws_iam_role.tator_websocket_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.tator_ddb_stream_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
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
      SR_WEBSOCKET_EP                 = "ws.example.com"
    }
  }
}

resource "aws_lambda_event_source_mapping" "tator_ddb_stream" {
  event_source_arn  = aws_dynamodb_table.tator_user_notifications.stream_arn
  function_name     = aws_lambda_function.tator_ddb_stream.arn
  starting_position = "LATEST"
}

resource "aws_lambda_alias" "tator_ddb_stream" {
  name             = "tatorDDBStream_Latest"
  description      = "tatorDDBStream $LATEST"
  function_name    = aws_lambda_function.tator_ddb_stream.arn
  function_version = aws_lambda_function.tator_ddb_stream.version
}

resource "null_resource" "tator_ddb_stream_check_weight" {
  triggers = {
    lambda_alias = aws_lambda_alias.tator_ddb_stream.id
  }

  provisioner "local-exec" {
    # loop until the alias is not weighted
    command = <<EOF
    while : 
    do
      echo 'Checking for weights on API lambda alias...'
      weights=$(aws --region ${var.aws_region} lambda get-alias --function-name ${aws_lambda_function.tator_ddb_stream.function_name} --name 'tatorDDBStream_Latest' --query 'RoutingConfig' || echo null)
      if [ "$weights" == "null" ]; then
        break
      fi
      sleep 5
    done
    EOF
  }
}

resource "aws_lambda_provisioned_concurrency_config" "tator_ddb_stream" {
  count                             = var.enable_lambda_provisioned ? 1 : 0
  depends_on                        = [null_resource.tator_ddb_stream_check_weight]
  function_name                     = aws_lambda_alias.tator_ddb_stream.function_name
  provisioned_concurrent_executions = 1
  qualifier                         = aws_lambda_alias.tator_ddb_stream.name
}

