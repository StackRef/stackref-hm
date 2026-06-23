data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "vpcs/stackref-dev/terraform.tfstate"
    bucket = "stackref-terraform-state-core"
  }
}

resource "aws_security_group" "lambda" {
  name        = "SR-LAMBDA-${var.environment}"
  description = "Lambda Security Group for ${var.environment}"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_dev

  ingress {
    description = "Permit from ${var.environment} VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.vpc.outputs.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.vpc.outputs.vpc_cidr]
  }
}

resource "aws_security_group" "memcached_private" {
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_dev
  name_prefix = "SR-Elasticache-${var.environment}-"
  description = "Elasticache Default Security Group (${var.environment})"

  ingress {
    self        = true
    cidr_blocks = ["10.0.0.0/8"]
    from_port   = 11211
    to_port     = 11211
    protocol    = "tcp"
  }

  egress {
    #tfsec:ignore:aws-vpc-no-public-egress-sgr
    cidr_blocks = ["0.0.0.0/0"]
    #tfsec:ignore:aws-vpc-no-public-egress-sgr
    ipv6_cidr_blocks = ["::/0"]
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
  }

  tags = {
    Name = "stackref-elasticache-main-${var.environment}"
  }
}
