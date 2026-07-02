resource "aws_cloudwatch_log_group" "db" {
  name              = "/aws/rds/cluster/sr-db-${var.environment}/postgresql"
  retention_in_days = 30
}
