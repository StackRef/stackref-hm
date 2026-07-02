data "archive_file" "generate_uuid_lambda_payload" {
  type       = "zip"
  source_dir = var.generate_uuid_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.generate_uuid_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "generate_uuid" {
  filename         = data.archive_file.generate_uuid_lambda_payload.output_path
  function_name    = "generateUUID"
  description      = "Generate and return simple UUID"
  role             = aws_iam_role.stackref_main_api.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.generate_uuid_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 10
  publish          = "true"
  architectures    = ["arm64"]

  tracing_config {
    mode = "Active"
  }

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SR_LOGGING_LEVEL = var.sr_logging_level
    }
  }
}

resource "aws_lambda_permission" "generate_uuid" {
  statement_id  = "AllowAPIGatewayInvoke-generateUUID"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generate_uuid.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/generateUUID"
}
