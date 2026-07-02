data "aws_lambda_layer_version" "python_lambda_layer" {
  layer_name              = "standard_python_lambda_layer"
  compatible_architecture = "arm64"
}

data "archive_file" "lambda_payload" {
  type       = "zip"
  source_dir = "./lambda/src"
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "./lambda/payload/payload.zip"
}

resource "aws_lambda_function" "umpire" {
  filename         = data.archive_file.lambda_payload.output_path
  function_name    = "Umpire"
  description      = "Config rule and CloudTrail processing for all organization team accounts"
  role             = aws_iam_role.umpire_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 15
  publish          = "true"
  architectures    = ["arm64"]

  layers = [data.aws_lambda_layer_version.python_lambda_layer.arn]

  vpc_config {
    subnet_ids = [
      data.terraform_remote_state.vpc.outputs.private_subnet_a


    ]
    security_group_ids = [data.aws_security_group.memcached_private.id]
  }

  environment {
    variables = {
      SR_UMPIRE_VERSION = var.sr_umpire_version
      SR_LOGGING_LEVEL  = var.sr_logging_level
    }
  }
}

resource "aws_lambda_permission" "umpire_aws_config" {
  statement_id  = "AllowAWSConfig"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.umpire.arn
  principal     = "config.amazonaws.com"
}

resource "aws_lambda_permission" "umpire_cloudwatch" {
  statement_id  = "AllowCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.umpire.arn
  principal     = "logs.amazonaws.com"
}
