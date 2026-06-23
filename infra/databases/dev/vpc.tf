data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "vpcs/stackref-dev/terraform.tfstate"
    bucket = "stackref-acme-terraform-state-core"
  }
}

resource "aws_security_group" "rds" {
  name        = "SR-RDS-${var.environment}"
  description = "RDS Security Group for ${var.environment}"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_dev

  ingress {
    description = "Permit Postgres from ${var.environment} VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.vpc.outputs.vpc_cidr]
  }

  ingress {
    description = "Permit HTTPS API from ${var.environment} VPC"
    from_port   = 443
    to_port     = 443
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

#data "aws_security_group" "lambda" {
#  name = "SR-LAMBDA-${var.environment}"
#}

/*
resource "aws_vpc_endpoint" "rds_data" {
  private_dns_enabled = true
  security_group_ids = [
    aws_security_group.rds.id,
    data.aws_security_group.lambda.id
  ]
  service_name = "com.amazonaws.us-east-1.rds-data"
  subnet_ids = [
    data.terraform_remote_state.vpc.outputs.public_subnet_a,
    data.terraform_remote_state.vpc.outputs.public_subnet_b,
    data.terraform_remote_state.vpc.outputs.public_subnet_c
  ]
  vpc_endpoint_type = "Interface"
  vpc_id            = data.terraform_remote_state.vpc.outputs.vpc_dev
}
*/
