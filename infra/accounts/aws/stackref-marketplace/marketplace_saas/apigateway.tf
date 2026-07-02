data "aws_api_gateway_rest_api" "marketplace_saas" {
  # NOTE: The below name will change if the CloudFormation stack needs to be redeployed
  name = "sr-mp-saas-SampleApp-15LL1F699XCQZ"

  depends_on = [ aws_cloudformation_stack.marketplace_saas ]
}

resource "aws_api_gateway_domain_name" "awsmp_stackref_com" {
  certificate_arn = data.aws_acm_certificate.awsmp_stackref_com.arn
  domain_name     = "awsmp.example.com"
}

resource "aws_api_gateway_base_path_mapping" "marketplace_saas" {
  api_id      = data.aws_api_gateway_rest_api.marketplace_saas.id
  stage_name  = "Prod"
  domain_name = aws_api_gateway_domain_name.awsmp_stackref_com.domain_name
}

resource "aws_api_gateway_resource" "fulfillment_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.marketplace_saas.id
  parent_id   = data.aws_api_gateway_rest_api.marketplace_saas.root_resource_id
  path_part   = "fulfillment"
}

resource "aws_api_gateway_method" "fulfillment_method" {
  rest_api_id   = data.aws_api_gateway_rest_api.marketplace_saas.id
  resource_id   = aws_api_gateway_resource.fulfillment_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "fulfillment_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.marketplace_saas.id
  resource_id             = aws_api_gateway_resource.fulfillment_resource.id
  http_method             = aws_api_gateway_method.fulfillment_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.fulfillment_function.invoke_arn
}

resource "aws_api_gateway_deployment" "example_deployment" {
  rest_api_id = data.aws_api_gateway_rest_api.marketplace_saas.id
  stage_name  = "prod"
  depends_on = [
    aws_api_gateway_integration.fulfillment_integration
  ]
}
