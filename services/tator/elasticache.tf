data "aws_elasticache_cluster" "stackref_main" {
  cluster_id = "stackref-main-${var.environment}"
}
