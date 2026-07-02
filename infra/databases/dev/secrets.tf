resource "aws_secretsmanager_secret" "rds_sradmin" {
  name_prefix = "sr-rds-v2-${var.environment}-"
  description = "RDS database postgres credentials for sradmin user stackref-v2-${var.environment}"
}

resource "aws_secretsmanager_secret" "rds_sr_api" {
  name_prefix = "sr-rds-v2-${var.environment}-"
  description = "RDS database postgres credentials for sr_api user in stackref-v2-${var.environment}"
}


locals {
  secret_contents_sradmin = {
    host     = "${aws_rds_cluster.v2_cluster.endpoint}"
    port     = "5432"
    username = "sradmin"
    password = "${var.sradmin_db_password}"
  }
  secret_contents_sr_api = {
    host     = "${aws_rds_cluster.v2_cluster.endpoint}"
    port     = "5432"
    username = "sr_api"
    password = "${var.sr_api_db_password}"
  }
}

resource "aws_secretsmanager_secret_version" "rds_sradmin" {
  secret_id     = aws_secretsmanager_secret.rds_sradmin.id
  secret_string = jsonencode(local.secret_contents_sradmin)

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_version" "rds_sr_api" {
  secret_id     = aws_secretsmanager_secret.rds_sr_api.id
  secret_string = jsonencode(local.secret_contents_sr_api)

  lifecycle {
    ignore_changes = [secret_string]
  }
}
