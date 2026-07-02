resource "aws_elasticache_cluster" "stackref_main" {
  cluster_id           = "stackref-main-${var.environment}"
  engine               = "memcached"
  engine_version       = "1.6.17"
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.memcached1.6"
  port                 = 11211

  apply_immediately  = true
  maintenance_window = "sat:05:00-sat:09:00"

  # TODO: When we are ready to pay for NAT Gateways, these need to move to Private (as well as the Lambdas)
  subnet_group_name  = aws_elasticache_subnet_group.stackref_public.name
  security_group_ids = [aws_security_group.memcached_private.id]

  tags = {
    Name = "stackref-main-${var.environment}"
  }
}

resource "aws_elasticache_subnet_group" "stackref_public" {
  name = "stackref-main-public-${var.environment}"
  subnet_ids = [
    data.terraform_remote_state.vpc.outputs.public_subnet_a,
    data.terraform_remote_state.vpc.outputs.public_subnet_b,
    data.terraform_remote_state.vpc.outputs.public_subnet_c
  ]
}

resource "aws_elasticache_subnet_group" "stackref_private" {
  name = "stackref-main-private-${var.environment}"
  subnet_ids = [
    data.terraform_remote_state.vpc.outputs.private_subnet_a,
    data.terraform_remote_state.vpc.outputs.private_subnet_b,
    data.terraform_remote_state.vpc.outputs.private_subnet_c
  ]
}
