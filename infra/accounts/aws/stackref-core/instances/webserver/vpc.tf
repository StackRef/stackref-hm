data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "vpcs/stackref-dev/terraform.tfstate"
    bucket = "example-terraform-state-core"
  }
}

resource "aws_security_group" "ec2" {
  name_prefix = "SR-EC2-webserver-${var.environment}-"
  description = "Webserver Security Group"

  vpc_id = data.terraform_remote_state.vpc.outputs.vpcs.us-east-1

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "SR-EC2-webserver-${var.environment}"
  }
}

resource "aws_security_group_rule" "ingress_80" {
  type                     = "ingress"
  source_security_group_id = aws_security_group.ec2.id
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  description              = "ELB"
  security_group_id        = data.terraform_remote_state.vpc.outputs.elb_sg
}

resource "aws_security_group_rule" "ingress_443" {
  type                     = "ingress"
  source_security_group_id = aws_security_group.ec2.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  description              = "ELB"
  security_group_id        = data.terraform_remote_state.vpc.outputs.elb_sg
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
