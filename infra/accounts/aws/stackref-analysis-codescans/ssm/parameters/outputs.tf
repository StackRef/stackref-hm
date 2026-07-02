output "snyk_token_arn" {
  value = aws_ssm_parameter.snyk_token.arn
}

output "snyk_token_name" {
  value = aws_ssm_parameter.snyk_token.name
}
