resource "aws_db_subnet_group" "sg" {
  name       = "sr-${var.environment}"
  subnet_ids = data.terraform_remote_state.vpc.outputs.public_subnets.us-east-1

  tags = {
    Name = "sr-db-${var.environment}"
  }
}

resource "aws_rds_cluster" "v2_cluster" {
  cluster_identifier                  = "stackref-v2-${var.environment}"
  engine                              = "aurora-postgresql"
  engine_mode                         = "provisioned"
  engine_version                      = "16.4"
  availability_zones                  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  database_name                       = "sr"
  master_username                     = "sradmin"
  master_password                     = var.sradmin_db_password
  backup_retention_period             = 1
  preferred_backup_window             = "07:00-09:00"
  preferred_maintenance_window        = "sat:01:00-sat:04:00"
  copy_tags_to_snapshot               = true
  db_subnet_group_name                = aws_db_subnet_group.v2_cluster.name
  allow_major_version_upgrade         = true
  vpc_security_group_ids              = [aws_security_group.rds.id]
  final_snapshot_identifier           = "stackref-v2-${var.environment}-final"
  kms_key_id                          = data.aws_kms_key.rds.arn
  iam_database_authentication_enabled = true
  enabled_cloudwatch_logs_exports     = ["postgresql"]
  storage_encrypted                   = true
  db_cluster_parameter_group_name     = "default.aurora-postgresql16"

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2
  }

  lifecycle {
    ignore_changes = [master_password]
  }
}

resource "aws_rds_cluster_instance" "v2_cluster_instances" {
  count                        = 1
  identifier                   = "stackref-v2-${var.environment}-instance-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.v2_cluster.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.v2_cluster.engine
  engine_version               = aws_rds_cluster.v2_cluster.engine_version
  monitoring_interval          = 0
  performance_insights_enabled = false
  promotion_tier               = count.index + 1
  ca_cert_identifier           = "rds-ca-rsa2048-g1"
}

resource "aws_db_subnet_group" "v2_cluster" {
  name       = "sr-db-v2-${var.environment}"
  subnet_ids = data.terraform_remote_state.vpc.outputs.private_subnets.us-east-1

  tags = {
    Name = "sr-db-v2-${var.environment}"
  }
}

resource "aws_rds_cluster_role_association" "v2_cluster" {
  db_cluster_identifier = aws_rds_cluster.v2_cluster.id
  feature_name          = "Lambda"
  role_arn              = aws_iam_role.rds.arn
}
