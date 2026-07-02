data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "vpcs/stackref-dev/terraform.tfstate"
    bucket = "example-terraform-state-core"
  }
}

data "aws_security_group" "memcached_private" {
  tags = {
    Name = "stackref-elasticache-main-${var.environment}"
  }
}
