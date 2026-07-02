output "aws_scim_url_arn" {
  value = aws_ssm_parameter.aws_scim_url.arn
}

output "aws_scim_token_arn" {
  value = aws_ssm_parameter.aws_scim_token.arn
}

output "stripe_api_key_dev_arn" {
  value = aws_ssm_parameter.stripe_api_key_dev.arn
}

output "stripe_endpoint_secret_dev_arn" {
  value = aws_ssm_parameter.stripe_endpoint_secret_dev.arn
}

output "stripe_api_key_prod_arn" {
  value = aws_ssm_parameter.stripe_api_key_prod.arn
}

output "stripe_endpoint_secret_prod_arn" {
  value = aws_ssm_parameter.stripe_endpoint_secret_prod.arn
}

output "openapi_api_key_arn" {
  value = aws_ssm_parameter.openai_api_key.arn
}

output "aws_scim_url_name" {
  value = aws_ssm_parameter.aws_scim_url.name
}

output "aws_scim_token_name" {
  value = aws_ssm_parameter.aws_scim_token.name
}

output "stripe_api_key_dev_name" {
  value = aws_ssm_parameter.stripe_api_key_dev.name
}

output "stripe_endpoint_secret_dev_name" {
  value = aws_ssm_parameter.stripe_endpoint_secret_dev.name
}

output "stripe_api_key_prod_name" {
  value = aws_ssm_parameter.stripe_api_key_prod.name
}

output "stripe_endpoint_secret_prod_name" {
  value = aws_ssm_parameter.stripe_endpoint_secret_prod.name
}

output "openapi_api_key_name" {
  value = aws_ssm_parameter.openai_api_key.name
}
