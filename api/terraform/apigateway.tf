resource "aws_apigatewayv2_api" "stackref_main" {
  name          = "stackref_main"
  description   = "Handler for client requests"
  protocol_type = "HTTP"
  version       = var.sr_api_version

  disable_execute_api_endpoint = true

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods = [
      "GET",
      "POST",
      "HEAD",
      "OPTIONS"
    ]
    allow_origins = [
      "https://app.example.com",
      "https://beta.example.com",
      "https://dev.example.com",
      "https://demo.example.com"
    ]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.stackref_main.id
  name        = "$default"
  description = "Default stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  }

  default_route_settings {
    #detailed_metrics_enabled = true
    #logging_level            = "INFO"
    throttling_burst_limit = 100
    throttling_rate_limit  = 2000
  }
}

resource "aws_apigatewayv2_stage" "v1" {
  api_id      = aws_apigatewayv2_api.stackref_main.id
  name        = "v1"
  description = "V1 stage - Auto-deployed"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  }

  default_route_settings {
    detailed_metrics_enabled = false
    throttling_burst_limit   = 100
    throttling_rate_limit    = 2000
  }
}

resource "aws_apigatewayv2_stage" "v2" {
  api_id      = aws_apigatewayv2_api.stackref_main.id
  name        = "v2"
  description = "V2 stage - Non-auto"
  auto_deploy = false

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  }

  default_route_settings {
    detailed_metrics_enabled = false
    throttling_burst_limit   = 100
    throttling_rate_limit    = 2000
  }
}

resource "aws_apigatewayv2_integration" "asset_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "assetCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.asset_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_asset_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /assetCreate"
  target             = "integrations/${aws_apigatewayv2_integration.asset_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_asset_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/assetCreate"
  target             = "integrations/${aws_apigatewayv2_integration.asset_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "asset_delete" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "assetDelete"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.asset_delete.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_asset_delete" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /assetDelete"
  target             = "integrations/${aws_apigatewayv2_integration.asset_delete.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_asset_delete" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/assetDelete"
  target             = "integrations/${aws_apigatewayv2_integration.asset_delete.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "asset_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "assetRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.asset_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_asset_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /assetRead"
  target             = "integrations/${aws_apigatewayv2_integration.asset_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_asset_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/assetRead"
  target             = "integrations/${aws_apigatewayv2_integration.asset_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "amzn_mkt_entitlement" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "amznMktEntitlement"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.amzn_mkt_entitlement.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_amzn_mkt_entitlement" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /amznMktEntitlement"
  target             = "integrations/${aws_apigatewayv2_integration.amzn_mkt_entitlement.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_amzn_mkt_entitlement" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/amznMktEntitlement"
  target             = "integrations/${aws_apigatewayv2_integration.amzn_mkt_entitlement.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_amzn_mkt_entitlement" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /amznMktEntitlement"
  target             = "integrations/${aws_apigatewayv2_integration.amzn_mkt_entitlement.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_amzn_mkt_entitlement" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/amznMktEntitlement"
  target             = "integrations/${aws_apigatewayv2_integration.amzn_mkt_entitlement.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "stackcash_purchase" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "stackCashPurchase"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.stackcash_purchase.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_stackcash_purchase" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /stackCashPurchase"
  target             = "integrations/${aws_apigatewayv2_integration.stackcash_purchase.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_stackcash_purchase_stripe" {
  api_id    = aws_apigatewayv2_api.stackref_main.id
  route_key = "POST /stackCashPurchaseStripe"
  target    = "integrations/${aws_apigatewayv2_integration.stackcash_purchase.id}"
  # NOTE: Purposely without authorizer so Stripe can call it
}

resource "aws_apigatewayv2_route" "post_api_stackcash_purchase" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/stackCashPurchase"
  target             = "integrations/${aws_apigatewayv2_integration.stackcash_purchase.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_stackcash_purchase_stripe" {
  api_id    = aws_apigatewayv2_api.stackref_main.id
  route_key = "POST /api/stackCashPurchaseStripe"
  target    = "integrations/${aws_apigatewayv2_integration.stackcash_purchase.id}"
  # NOTE: Purposely without authorizer so Stripe can call it
}

resource "aws_apigatewayv2_integration" "cloud_account_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "cloudAccountRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.cloud_account_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_cloud_account_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /cloudAccountRead"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_cloud_account_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/cloudAccountRead"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "cloud_account_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "cloudAccountUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.cloud_account_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_cloud_account_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /cloudAccountUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_cloud_account_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/cloudAccountUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "cloud_account_user_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "cloudAccountUserCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.cloud_account_user_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_cloud_account_user_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /cloudAccountUserCreate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_cloud_account_user_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/cloudAccountUserCreate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "cloud_account_user_delete" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "cloudAccountUserDelete"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.cloud_account_user_delete.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_cloud_account_user_delete" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /cloudAccountUserDelete"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_delete.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_cloud_account_user_delete" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/cloudAccountUserDelete"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_delete.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "cloud_account_user_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "cloudAccountUserUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.cloud_account_user_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_cloud_account_user_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /cloudAccountUserUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_cloud_account_user_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/cloudAccountUserUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.cloud_account_user_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "coin_bank_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "coinBankRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.coin_bank_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_coin_bank_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /coinBankRead"
  target             = "integrations/${aws_apigatewayv2_integration.coin_bank_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_coin_bank_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/coinBankRead"
  target             = "integrations/${aws_apigatewayv2_integration.coin_bank_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "coin_bank_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "coinBankUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.coin_bank_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_coin_bank_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /coinBankUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.coin_bank_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_coin_bank_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/coinBankUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.coin_bank_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "resources" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "resourceData"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.resource_data.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_resources" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /resources"
  target             = "integrations/${aws_apigatewayv2_integration.resources.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_resources" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/resources"
  target             = "integrations/${aws_apigatewayv2_integration.resources.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "services" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "serviceData"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.service_data.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_services" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /services"
  target             = "integrations/${aws_apigatewayv2_integration.services.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_services" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/services"
  target             = "integrations/${aws_apigatewayv2_integration.services.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "playbooks" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "playbookData"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.playbook_data.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_playbooks" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /playbooks"
  target             = "integrations/${aws_apigatewayv2_integration.playbooks.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_playbooks" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/playbooks"
  target             = "integrations/${aws_apigatewayv2_integration.playbooks.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_playbooks" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /playbooks"
  target             = "integrations/${aws_apigatewayv2_integration.playbooks.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_playbooks" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/playbooks"
  target             = "integrations/${aws_apigatewayv2_integration.playbooks.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "judging_criterion_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "judgingCriterionCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.judging_criterion_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_judging_criterion_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /judgingCriterionCreate"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_judging_criterion_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/judgingCriterionCreate"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "judging_criterion_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "judgingCriterionRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.judging_criterion_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_judging_criterion_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /judgingCriterionRead"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_judging_criterion_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/judgingCriterionRead"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "judging_criterion_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "judgingCriterionUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.judging_criterion_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_judging_criterion_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /judgingCriterionUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_judging_criterion_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/judgingCriterionUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.judging_criterion_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "marketplace_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "marketplaceRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.marketplace_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_marketplace_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /marketplaceRead"
  target             = "integrations/${aws_apigatewayv2_integration.marketplace_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_marketplace_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/marketplaceRead"
  target             = "integrations/${aws_apigatewayv2_integration.marketplace_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "organization_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "organizationRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.organization_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_organization_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /organizationRead"
  target             = "integrations/${aws_apigatewayv2_integration.organization_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_organization_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/organizationRead"
  target             = "integrations/${aws_apigatewayv2_integration.organization_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "user_registration" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "userRegistration"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.user_registration.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_user_registration" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /userRegistration"
  target             = "integrations/${aws_apigatewayv2_integration.user_registration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_user_registration" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/userRegistration"
  target             = "integrations/${aws_apigatewayv2_integration.user_registration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "get_user" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "getUser"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.get_user.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_get_user" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /getUser"
  target             = "integrations/${aws_apigatewayv2_integration.get_user.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_get_user" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/getUser"
  target             = "integrations/${aws_apigatewayv2_integration.get_user.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "organization_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "organizationCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.organization_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_organization_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /organizationCreate"
  target             = "integrations/${aws_apigatewayv2_integration.organization_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_organization_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/organizationCreate"
  target             = "integrations/${aws_apigatewayv2_integration.organization_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "organization_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "organizationUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.organization_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_organization_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /organizationUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.organization_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_organization_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/organizationUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.organization_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "organization_invitation" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "organizationInvitation"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.organization_invitation.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_organization_invitation" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /organizationInvitation"
  target             = "integrations/${aws_apigatewayv2_integration.organization_invitation.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_organization_invitation" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/organizationInvitation"
  target             = "integrations/${aws_apigatewayv2_integration.organization_invitation.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_organization_invitation" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /organizationInvitation"
  target             = "integrations/${aws_apigatewayv2_integration.organization_invitation.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_organization_invitation" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/organizationInvitation"
  target             = "integrations/${aws_apigatewayv2_integration.organization_invitation.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "user_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "userRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.user_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_user_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /userRead"
  target             = "integrations/${aws_apigatewayv2_integration.user_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_user_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/userRead"
  target             = "integrations/${aws_apigatewayv2_integration.user_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "user_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "userUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.user_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_user_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /userUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.user_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_user_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/userUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.user_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "user_tag_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "userTagRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.user_tag_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_user_tag_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /userTagRead"
  target             = "integrations/${aws_apigatewayv2_integration.user_tag_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_user_tag_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/userTagRead"
  target             = "integrations/${aws_apigatewayv2_integration.user_tag_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "event_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "eventCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.event_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_event_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /eventCreate"
  target             = "integrations/${aws_apigatewayv2_integration.event_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_event_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/eventCreate"
  target             = "integrations/${aws_apigatewayv2_integration.event_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "participant_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "participantCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.participant_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_participant_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /participantCreate"
  target             = "integrations/${aws_apigatewayv2_integration.participant_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_participant_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/participantCreate"
  target             = "integrations/${aws_apigatewayv2_integration.participant_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "participant_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "participantRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.participant_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_participant_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /participantRead"
  target             = "integrations/${aws_apigatewayv2_integration.participant_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_participant_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/participantRead"
  target             = "integrations/${aws_apigatewayv2_integration.participant_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "participant_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "participantUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.participant_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_participant_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /participantUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.participant_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_participant_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/participantUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.participant_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# TEAM

resource "aws_apigatewayv2_integration" "team_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamCreate"
  target             = "integrations/${aws_apigatewayv2_integration.team_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamCreate"
  target             = "integrations/${aws_apigatewayv2_integration.team_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_team_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /teamRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_team_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/teamRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# TEAM EVENT FEEDBACK

resource "aws_apigatewayv2_integration" "team_event_feedback_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamEventFeedbackRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_event_feedback_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_team_event_feedback_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /teamEventFeedbackRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_event_feedback_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_team_event_feedback_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/teamEventFeedbackRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_event_feedback_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_event_feedback_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamEventFeedbackUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_event_feedback_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_event_feedback_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamEventFeedbackUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_event_feedback_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_event_feedback_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamEventFeedbackUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_event_feedback_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# TEAM MEMBER

resource "aws_apigatewayv2_integration" "team_member_create" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamMemberCreate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_member_create.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_member_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamMemberCreate"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_member_create" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamMemberCreate"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_create.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_member_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamMemberRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_member_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_team_member_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /teamMemberRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_team_member_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/teamMemberRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_member_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamMemberUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_member_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_member_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamMemberUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_member_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamMemberUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_member_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

## TEAM ANALYSIS

resource "aws_apigatewayv2_integration" "team_analysis_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamAnalysisRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_analysis_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_team_analysis_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /teamAnalysisRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_analysis_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_team_analysis_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/teamAnalysisRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_analysis_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# TEAM SCORE ITEM

resource "aws_apigatewayv2_integration" "team_score_item_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamScoreItemRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_score_item_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_team_score_item_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /teamScoreItemRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_score_item_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_team_score_item_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/teamScoreItemRead"
  target             = "integrations/${aws_apigatewayv2_integration.team_score_item_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "team_score_item_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "teamScoreItemUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.team_score_item_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_team_score_item_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /teamScoreItemUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_score_item_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_team_score_item_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/teamScoreItemUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.team_score_item_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# EVENT

resource "aws_apigatewayv2_integration" "event_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "eventRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.event_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_event_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /eventRead"
  target             = "integrations/${aws_apigatewayv2_integration.event_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_event_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/eventRead"
  target             = "integrations/${aws_apigatewayv2_integration.event_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "event_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "eventUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.event_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_event_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /eventUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.event_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_event_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/eventUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.event_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "generate_uuid" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "generateUUID"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.generate_uuid.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_generate_uuid" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /generateUUID"
  target             = "integrations/${aws_apigatewayv2_integration.generate_uuid.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_generate_uuid" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/generateUUID"
  target             = "integrations/${aws_apigatewayv2_integration.generate_uuid.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

# KANBAN

resource "aws_apigatewayv2_integration" "kanban_read" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "kanbanRead"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.kanban_read.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "get_kanban_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /kanbanRead"
  target             = "integrations/${aws_apigatewayv2_integration.kanban_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "get_api_kanban_read" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "GET /api/kanbanRead"
  target             = "integrations/${aws_apigatewayv2_integration.kanban_read.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "kanban_update" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "kanbanUpdate"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.kanban_update.arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "post_kanban_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /kanbanUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.kanban_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_route" "post_api_kanban_update" {
  api_id             = aws_apigatewayv2_api.stackref_main.id
  route_key          = "POST /api/kanbanUpdate"
  target             = "integrations/${aws_apigatewayv2_integration.kanban_update.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}


##

resource "aws_apigatewayv2_domain_name" "api_stackref_com" {
  domain_name = "api.example.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.stackref_com.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api_stackref_com" {
  api_id      = aws_apigatewayv2_api.stackref_main.id
  domain_name = aws_apigatewayv2_domain_name.api_stackref_com.id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_apigatewayv2_api_mapping" "api_stackref_com_v1" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.api_stackref_com.id
  stage           = aws_apigatewayv2_stage.v1.id
  api_mapping_key = "v1"
}

resource "aws_apigatewayv2_api_mapping" "api_stackref_com_v2" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.api_stackref_com.id
  stage           = aws_apigatewayv2_stage.v2.id
  api_mapping_key = "v2"
}

resource "aws_apigatewayv2_domain_name" "dev_stackref_com" {
  domain_name = "dev.example.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.stackref_com.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "dev_stackref_com_v1" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.dev_stackref_com.id
  stage           = aws_apigatewayv2_stage.v1.id
  api_mapping_key = "v1"
}

resource "aws_apigatewayv2_api_mapping" "dev_stackref_com_v2" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.dev_stackref_com.id
  stage           = aws_apigatewayv2_stage.v2.id
  api_mapping_key = "v2"
}

resource "aws_apigatewayv2_domain_name" "beta_stackref_com" {
  domain_name = "beta.example.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.stackref_com.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "beta_stackref_com_v1" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.beta_stackref_com.id
  stage           = aws_apigatewayv2_stage.v1.id
  api_mapping_key = "v1"
}

resource "aws_apigatewayv2_api_mapping" "beta_stackref_com_v2" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.beta_stackref_com.id
  stage           = aws_apigatewayv2_stage.v2.id
  api_mapping_key = "v2"
}

resource "aws_apigatewayv2_domain_name" "app_stackref_com" {
  domain_name = "app.example.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.stackref_com.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "app_stackref_com_v1" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.app_stackref_com.id
  stage           = aws_apigatewayv2_stage.v1.id
  api_mapping_key = "v1"
}

resource "aws_apigatewayv2_api_mapping" "app_stackref_com_v2" {
  api_id          = aws_apigatewayv2_api.stackref_main.id
  domain_name     = aws_apigatewayv2_domain_name.app_stackref_com.id
  stage           = aws_apigatewayv2_stage.v2.id
  api_mapping_key = "v2"
}

resource "aws_apigatewayv2_authorizer" "auth0" {
  api_id           = aws_apigatewayv2_api.stackref_main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "Auth0"

  jwt_configuration {
    audience = concat(
      data.terraform_remote_state.auth0.outputs.client_ids,
      [var.sr_auth0_be_audience]
    )
    issuer = "https://${var.sr_auth0_domain}/"
  }
}
