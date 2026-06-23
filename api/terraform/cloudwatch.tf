resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "apigateway/stackref_main"
  retention_in_days = 30
}
