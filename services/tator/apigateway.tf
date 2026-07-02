resource "aws_apigatewayv2_api" "tator_websocket" {
  name        = "tator_websocket_${var.environment}"
  description = "Websocket Handler for Tator and client requests"
  #version                    = "0.1"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_stage" "tator_websocket_default" {
  api_id      = aws_apigatewayv2_api.tator_websocket.id
  name        = "$default"
  description = "Default stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  }

  default_route_settings {
    detailed_metrics_enabled = true
    logging_level            = "INFO"
    throttling_burst_limit   = 100
    throttling_rate_limit    = 2000
  }

  tags = {
    environment = var.environment
  }
}

resource "aws_apigatewayv2_stage" "tator_websocket_dev" {
  api_id      = aws_apigatewayv2_api.tator_websocket.id
  name        = "dev"
  description = "Development stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId"
  }

  default_route_settings {
    logging_level          = "INFO"
    throttling_burst_limit = 100
    throttling_rate_limit  = 2000
  }

  tags = {
    environment = "dev"
  }
}

resource "aws_apigatewayv2_integration" "tator_websocket_connect" {
  api_id               = aws_apigatewayv2_api.tator_websocket.id
  integration_type     = "AWS_PROXY"
  connection_type      = "INTERNET"
  description          = "tator_websocket_connect_${var.environment}"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.tator_websocket_connect.invoke_arn
  timeout_milliseconds = 5000
  credentials_arn      = aws_iam_role.tator_websocket_api.arn
}

resource "aws_apigatewayv2_route" "tator_websocket_connect" {
  api_id    = aws_apigatewayv2_api.tator_websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.tator_websocket_connect.id}"

  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.auth0.id
}

resource "aws_apigatewayv2_integration" "tator_websocket_default" {
  api_id               = aws_apigatewayv2_api.tator_websocket.id
  integration_type     = "AWS_PROXY"
  connection_type      = "INTERNET"
  description          = "tator_websocket_default_${var.environment}"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.tator_websocket_default.invoke_arn
  timeout_milliseconds = 5000
  credentials_arn      = aws_iam_role.tator_websocket_api.arn
}

resource "aws_apigatewayv2_route" "tator_websocket_default" {
  api_id    = aws_apigatewayv2_api.tator_websocket.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.tator_websocket_default.id}"
}

resource "aws_apigatewayv2_integration" "tator_websocket_disconnect" {
  api_id               = aws_apigatewayv2_api.tator_websocket.id
  integration_type     = "AWS_PROXY"
  connection_type      = "INTERNET"
  description          = "tator_websocket_disconnect_${var.environment}"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.tator_websocket_disconnect.invoke_arn
  timeout_milliseconds = 5000
  credentials_arn      = aws_iam_role.tator_websocket_api.arn
}

resource "aws_apigatewayv2_route" "tator_websocket_disconnect" {
  api_id    = aws_apigatewayv2_api.tator_websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.tator_websocket_disconnect.id}"
}

resource "aws_apigatewayv2_domain_name" "ws_stackref_com" {
  domain_name = "ws.acme.example.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.stackref_com.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "ws_stackref_com" {
  api_id      = aws_apigatewayv2_api.tator_websocket.id
  domain_name = aws_apigatewayv2_domain_name.ws_stackref_com.id
  stage       = aws_apigatewayv2_stage.tator_websocket_default.id
}

resource "aws_apigatewayv2_authorizer" "auth0" {
  api_id                     = aws_apigatewayv2_api.tator_websocket.id
  authorizer_type            = "REQUEST"
  authorizer_uri             = data.aws_lambda_alias.auth0_authorizer.invoke_arn
  authorizer_credentials_arn = aws_iam_role.tator_websocket_api.arn
  identity_sources           = ["route.request.querystring.auth"]
  name                       = "Auth0"
}
