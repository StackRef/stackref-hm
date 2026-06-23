data "archive_file" "participant_read_lambda_payload" {
  type       = "zip"
  source_dir = var.participant_read_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.participant_read_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "participant_read" {
  filename         = data.archive_file.participant_read_lambda_payload.output_path
  function_name    = "participantRead"
  description      = "Reads event participants"
  role             = aws_iam_role.stackref_main_api.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.participant_read_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  publish          = "true"
  architectures    = ["arm64"]

  tracing_config {
    mode = "Active"
  }

  layers = [aws_lambda_layer_version.python_lambda_layer.arn]

  vpc_config {
    subnet_ids = [
      data.terraform_remote_state.vpc.outputs.private_subnet_a


    ]
    security_group_ids          = [aws_security_group.memcached_private.id]
    ipv6_allowed_for_dual_stack = true
  }

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SENTRY_ENVIRONMENT   = var.environment
      SENTRY_RELEASE       = var.sr_api_version
      SR_API_VERSION       = var.sr_api_version
      SR_DB_NAME           = var.sr_db_name
      SR_DB_SECRET_ARN     = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP  = aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL     = var.sr_logging_level
      SR_AUTH0_DOMAIN      = var.sr_auth0_domain
      SR_AUTH0_CLIENT_IDS  = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE = var.sr_auth0_be_audience
    }
  }
}

resource "aws_lambda_permission" "participant_read" {
  statement_id  = "AllowAPIGatewayInvoke-participantRead"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.participant_read.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/participantRead"
}
