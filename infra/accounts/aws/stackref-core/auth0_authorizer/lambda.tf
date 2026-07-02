data "aws_lambda_layer_version" "python_lambda_layer" {
  layer_name = "standard_python_lambda_layer"
}

data "archive_file" "lambda_payload" {
  type        = "zip"
  source_dir  = var.lambda_src_dir
  output_path = "${var.lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "auth0_authorizer" {
  filename         = data.archive_file.lambda_payload.output_path
  function_name    = "auth0Authorizer"
  description      = "For authorizing with Auth0 on services that do not support JWT"
  role             = aws_iam_role.lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10
  publish          = "true"
  architectures    = ["arm64"]

  layers = [data.aws_lambda_layer_version.python_lambda_layer.arn]

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SENTRY_ENVIRONMENT   = var.environment
      SENTRY_RELEASE       = var.sr_authorizer_version
      SR_LOGGING_LEVEL     = var.sr_logging_level
      SR_AUTH0_DOMAIN      = var.sr_auth0_domain
      SR_AUTH0_CLIENT_ID   = var.sr_auth0_client_id
      SR_AUTH0_CLIENT_IDS  = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE = var.sr_auth0_be_audience
    }
  }
}

resource "aws_lambda_alias" "auth0_authorizer_latest" {
  name             = "auth0AuthorizerLatest"
  description      = "Latest deployment of auth0Authorizer"
  function_name    = aws_lambda_function.auth0_authorizer.arn
  function_version = "$LATEST"
}
