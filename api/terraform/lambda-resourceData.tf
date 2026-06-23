data "archive_file" "resource_data_lambda_payload" {
  type       = "zip"
  source_dir = var.resource_data_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.resource_data_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "resource_data" {
  filename         = data.archive_file.resource_data_lambda_payload.output_path
  function_name    = "resourceData"
  description      = "Processes requests for resource data"
  role             = aws_iam_role.stackref_main_api.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.resource_data_lambda_payload.output_base64sha256
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
      SR_DB_ARN            = data.terraform_remote_state.rds.outputs.rds_v2_arn
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

resource "aws_lambda_permission" "resource_data" {
  statement_id  = "AllowAPIGatewayInvoke-resourceData"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resource_data.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/resources"
}
