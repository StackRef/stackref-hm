data "archive_file" "amazon_mkt_meter_lambda_payload" {
  type       = "zip"
  source_dir = var.amazon_mkt_meter_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.amazon_mkt_meter_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "amazon_mkt_meter" {
  filename         = data.archive_file.amazon_mkt_meter_lambda_payload.output_path
  function_name    = "amazonMktMeter"
  description      = "Handles Amazon Marketplace metering"
  role             = aws_iam_role.shot_clock_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.amazon_mkt_meter_lambda_payload.output_base64sha256
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
      SR_SHOT_CLOCK_VERSION       = var.sr_shot_clock_version
      SR_DB_NAME                  = var.sr_db_name
      SR_DB_SECRET_ARN            = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP         = data.aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL            = var.sr_logging_level
      SR_MARKETPLACE_PRODUCT_CODE = var.sr_aws_marketplace_product_code
      SR_MARKETPLACE_ROLE         = var.sr_marketplace_role_arn
    }
  }
}

resource "aws_lambda_permission" "cloudwatch_event" {
  statement_id  = "AllowCloudWatchInvoke-amazonMktMeter"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.amazon_mkt_meter.arn
  principal     = "events.amazonaws.com"
  source_arn    = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/*"
}
