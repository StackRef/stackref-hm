output "rds_v2_arn" {
  value = aws_rds_cluster.v2_cluster.arn
}

output "rds_v2_endpoint" {
  value = aws_rds_cluster.v2_cluster.endpoint
}

output "rds_sradmin_secret_arn" {
  value = aws_secretsmanager_secret.rds_sradmin.arn
}

output "rds_sr_api_secret_arn" {
  value = aws_secretsmanager_secret.rds_sr_api.arn
}
