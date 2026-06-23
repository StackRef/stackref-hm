data "aws_lambda_layer_version" "python_lambda_layer" {
  layer_name              = "standard_python_lambda_layer"
  compatible_architecture = "arm64"
}

data "aws_lambda_alias" "auth0_authorizer" {
  function_name = "auth0Authorizer"
  name          = "auth0AuthorizerLatest"
}

data "aws_lambda_function" "auth0_authorizer" {
  function_name = "auth0Authorizer"
}

resource "aws_lambda_permission" "tator_websocket_auth" {
  statement_id  = "AllowAPIGatewayInvoke-TatorWS"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.auth0_authorizer.arn
  principal     = "apigateway.amazonaws.com"
  qualifier     = "auth0AuthorizerLatest"
  source_arn    = "${aws_apigatewayv2_api.tator_websocket.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.auth0.id}"
}

