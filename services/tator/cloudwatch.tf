resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "apigateway/tator_websocket_${var.environment}"
  retention_in_days = 30
}
