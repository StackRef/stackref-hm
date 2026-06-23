data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "vpcs/stackref-dev/terraform.tfstate"
    bucket = "stackref-acme-terraform-state-core"
  }
}

resource "aws_security_group" "ec2" {
  name_prefix = "SR-EC2-bastion-${var.environment}-"
  description = "Bastion Security Group"

  vpc_id = data.terraform_remote_state.vpc.outputs.vpcs.us-east-1

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "SR-EC2-bastion-${var.environment}"
  }
}

resource "aws_security_group_rule" "ingress_ssh" {
  type              = "ingress"
  security_group_id = aws_security_group.ec2.id
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  description       = "SSH"
}

resource "aws_security_group_rule" "egress" {
  type              = "egress"
  security_group_id = aws_security_group.ec2.id
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  description       = "Egress All"
}
