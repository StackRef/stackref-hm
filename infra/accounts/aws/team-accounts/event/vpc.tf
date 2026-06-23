resource "aws_default_vpc" "default" {
  tags = {
    Name                         = "Default VPC"
    terraform_managed            = "true"
    "stackref:organization_uuid" = var.organization_uuid
    "stackref:event_uuid"        = var.event_uuid
  }
}

data "aws_subnet_ids" "default" {
  vpc_id = aws_default_vpc.default.id
}

resource "random_shuffle" "subnet" {
  input        = data.aws_subnet_ids.default.ids
  result_count = 1
}

resource "aws_security_group" "ec2" {
  name        = "SR-EC2-coach"
  description = "StackRef Coach EC2"

  vpc_id = aws_default_vpc.default.id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name                         = "SR-EC2-coach"
    terraform_managed            = "true"
    "stackref:organization_uuid" = var.organization_uuid
    "stackref:event_uuid"        = var.event_uuid
  }
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
