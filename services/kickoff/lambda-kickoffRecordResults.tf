data "archive_file" "kickoff_record_results_lambda_payload" {
  type       = "zip"
  source_dir = var.kickoff_record_results_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.kickoff_record_results_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "kickoff_record_results" {
  filename         = data.archive_file.kickoff_record_results_lambda_payload.output_path
  function_name    = "kickoffRecordResults"
  description      = "Runs on S3 bucket notification of analysis results delivery"
  role             = aws_iam_role.kickoff_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.kickoff_record_results_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  publish          = "true"
  architectures    = ["arm64"]

  tracing_config {
    mode = "Active"
  }

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
      SR_KICKOFF_VERSION              = var.sr_kickoff_version
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
      SR_ANALYSIS_CODESCANS_ROLE      = var.sr_analysis_codescans_role_arn
      SR_ANALYSIS_ACCOUNT_ID          = var.sr_analysis_codescans_account_id
      SR_TATOR_SQS_URL                = data.terraform_remote_state.tator.outputs.sqs_queue_url
    }
  }
}

#tfsec:ignore:aws-lambda-restrict-source-arn
resource "aws_lambda_permission" "codecommit_kickoff_record_results" {
  statement_id   = "AllowS3Invoke-kickoffRecordResults"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.kickoff_record_results.arn
  principal      = "s3.amazonaws.com"
  source_account = var.sr_analysis_codescans_account_id
}
