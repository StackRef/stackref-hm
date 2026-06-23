resource "null_resource" "stackcash_purchase_dependencies" {
  triggers = {
    requirements = filebase64sha256("${var.stackcash_purchase_lambda_src_dir}/requirements.txt")
  }

  provisioner "local-exec" {
    command = "${var.stackcash_purchase_lambda_src_dir}/get_dependencies.sh"
  }
}

data "archive_file" "stackcash_purchase_lambda_payload" {
  type       = "zip"
  source_dir = var.stackcash_purchase_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.stackcash_purchase_lambda_payload_dir}/payload.zip"
  depends_on = [
    null_resource.stackcash_purchase_dependencies
  ]
}

resource "aws_lambda_function" "stackcash_purchase" {
  filename         = data.archive_file.stackcash_purchase_lambda_payload.output_path
  function_name    = "stackCashPurchase"
  description      = "Handles purchases of more StackCash"
  role             = aws_iam_role.stackref_main_api.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.stackcash_purchase_lambda_payload.output_base64sha256
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
      SENTRY_ENVIRONMENT                   = var.environment
      SENTRY_RELEASE                       = var.sr_api_version
      SR_API_VERSION                       = var.sr_api_version
      SR_DB_NAME                           = var.sr_db_name
      SR_DB_SECRET_ARN                     = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP                  = aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL                     = var.sr_logging_level
      SR_AUTH0_DOMAIN                      = var.sr_auth0_domain
      SR_AUTH0_CLIENT_IDS                  = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE                 = var.sr_auth0_be_audience
      SR_MARKETPLACE_PRODUCT_CODE          = var.sr_aws_marketplace_product_code
      SR_MARKETPLACE_ROLE                  = var.sr_marketplace_role_arn
      SR_STRIPE_API_KEY_DEV_PARAM          = data.terraform_remote_state.ssm.outputs.stripe_api_key_dev_name
      SR_STRIPE_ENDPOINT_SECRET_DEV_PARAM  = data.terraform_remote_state.ssm.outputs.stripe_endpoint_secret_dev_name
      SR_STRIPE_API_KEY_PROD_PARAM         = data.terraform_remote_state.ssm.outputs.stripe_api_key_prod_name
      SR_STRIPE_ENDPOINT_SECRET_PROD_PARAM = data.terraform_remote_state.ssm.outputs.stripe_endpoint_secret_prod_name
    }
  }
}

resource "aws_lambda_permission" "stackcash_purchase" {
  statement_id  = "AllowAPIGatewayInvoke-stackCashPurchase"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stackcash_purchase.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/stackCashPurchase"
}

resource "aws_lambda_permission" "stackcash_purchase_stripe" {
  statement_id  = "AllowAPIGatewayInvoke-stackCashPurchaseStripe"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stackcash_purchase.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/stackCashPurchaseStripe"
}
