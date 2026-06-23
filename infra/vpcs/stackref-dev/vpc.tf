resource "aws_vpc" "dev" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true

  tags = {
    Name              = "stackref-${var.environment}"
    terraform_managed = "true"
    project           = "rac"
  }
}

resource "aws_subnet" "private_az1" {
  vpc_id            = aws_vpc.dev.id
  cidr_block        = var.private_subnet_1
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "Private-AZ1-${var.environment}"
  }
}

resource "aws_subnet" "private_az2" {
  vpc_id            = aws_vpc.dev.id
  cidr_block        = var.private_subnet_2
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "Private-AZ2-${var.environment}"
  }
}

resource "aws_subnet" "private_az3" {
  vpc_id            = aws_vpc.dev.id
  cidr_block        = var.private_subnet_3
  availability_zone = "${var.aws_region}c"

  tags = {
    Name = "Private-AZ3-${var.environment}"
  }
}

resource "aws_subnet" "private_az4" {
  vpc_id            = aws_vpc.dev.id
  cidr_block        = var.private_subnet_4
  availability_zone = "${var.aws_region}d"

  tags = {
    Name = "Private-AZ4-${var.environment}"
  }
}

resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.dev.id
  cidr_block              = var.public_subnet_1
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ1-${var.environment}"
  }
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.dev.id
  cidr_block              = var.public_subnet_2
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ2-${var.environment}"
  }
}

resource "aws_subnet" "public_az3" {
  vpc_id                  = aws_vpc.dev.id
  cidr_block              = var.public_subnet_3
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ3-${var.environment}"
  }
}

resource "aws_subnet" "public_az4" {
  vpc_id                  = aws_vpc.dev.id
  cidr_block              = var.public_subnet_4
  availability_zone       = "${var.aws_region}d"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ4-${var.environment}"
  }
}

resource "aws_internet_gateway" "dev" {
  vpc_id = aws_vpc.dev.id

  tags = {
    Name = "SR-US-EAST-1-IGW-${var.environment}"
  }
}

## NOTE: Enable NAT gateways can be expensive, especially when not using them. Enable
## these only when we're ready to make use of them.

resource "aws_eip" "natgw_a" {
  domain = "vpc"
}

#resource "aws_eip" "natgw_b" {
  #domain = "vpc"
#}

#resource "aws_eip" "natgw_c" {
  #domain = "vpc"
#}

#resource "aws_eip" "natgw_d" {
  #domain = "vpc"
#}

resource "aws_nat_gateway" "natgw_a" {
  allocation_id = aws_eip.natgw_a.id
  subnet_id     = aws_subnet.public_az1.id

  depends_on = [aws_internet_gateway.dev]
}

#resource "aws_nat_gateway" "natgw_b" {
  #allocation_id = aws_eip.natgw_b.id
  #subnet_id     = aws_subnet.public_az2.id

  #depends_on = [aws_internet_gateway.dev]
#}

#resource "aws_nat_gateway" "natgw_c" {
  #allocation_id = aws_eip.natgw_c.id
  #subnet_id     = aws_subnet.public_az3.id

  #depends_on = [aws_internet_gateway.dev]
#}

#resource "aws_nat_gateway" "natgw_d" {
  #allocation_id = aws_eip.natgw_d.id
  #subnet_id     = aws_subnet.public_az4.id

  #depends_on = [aws_internet_gateway.dev]
#}

resource "aws_route_table" "private_a" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.natgw_a.id
    #gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name = "Route-Private-AZ1-${var.environment}"
  }
}

resource "aws_route_table" "private_b" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block     = "0.0.0.0/0"
#    nat_gateway_id = aws_nat_gateway.natgw_b.id
    gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name = "Route-Private-AZ2-${var.environment}"
  }
}

resource "aws_route_table" "private_c" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block     = "0.0.0.0/0"
#    nat_gateway_id = aws_nat_gateway.natgw_c.id
    gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name = "Route-Private-AZ3-${var.environment}"
  }
}

resource "aws_route_table" "private_d" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block     = "0.0.0.0/0"
#    nat_gateway_id = aws_nat_gateway.natgw_d.id
    gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name = "Route-Private-AZ4-${var.environment}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name = "Route-Public-${var.environment}"
  }
}

resource "aws_route_table_association" "private_a" {
  route_table_id = aws_route_table.private_a.id
  subnet_id      = aws_subnet.private_az1.id
}

resource "aws_route_table_association" "private_b" {
  route_table_id = aws_route_table.private_b.id
  subnet_id      = aws_subnet.private_az2.id
}

resource "aws_route_table_association" "private_c" {
  route_table_id = aws_route_table.private_c.id
  subnet_id      = aws_subnet.private_az3.id
}

resource "aws_route_table_association" "private_d" {
  route_table_id = aws_route_table.private_d.id
  subnet_id      = aws_subnet.private_az4.id
}

resource "aws_route_table_association" "public_a" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az1.id
}

resource "aws_route_table_association" "public_b" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az2.id
}

resource "aws_route_table_association" "public_c" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az3.id
}

resource "aws_route_table_association" "public_d" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az4.id
}

resource "aws_vpc_dhcp_options" "dev" {
  domain_name         = "${var.aws_region}.compute.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = {
    Name = "SR-US-EAST-1-DHCP-${var.environment}"
  }
}

resource "aws_vpc_dhcp_options_association" "dev" {
  vpc_id          = aws_vpc.dev.id
  dhcp_options_id = aws_vpc_dhcp_options.dev.id
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.dev.id
  subnet_ids = [aws_subnet.private_az1.id, aws_subnet.private_az2.id, aws_subnet.private_az3.id, aws_subnet.private_az4.id]

  ingress {
    cidr_block = "0.0.0.0/0"
    action     = "allow"
    from_port  = 0
    protocol   = "all"
    rule_no    = 100
    to_port    = 0
  }

  egress {
    cidr_block = "0.0.0.0/0"
    action     = "allow"
    from_port  = 0
    protocol   = "all"
    rule_no    = 100
    to_port    = 0
  }

  tags = {
    Name = "SR-US-EAST-1-PRIVATE-ACL-${var.environment}"
  }
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.dev.id
  subnet_ids = [aws_subnet.public_az1.id, aws_subnet.public_az2.id, aws_subnet.public_az3.id, aws_subnet.public_az4.id]

  ingress {
    cidr_block = "0.0.0.0/0"
    action     = "allow"
    from_port  = 0
    protocol   = "all"
    rule_no    = 100
    to_port    = 0
  }

  egress {
    cidr_block = "0.0.0.0/0"
    action     = "allow"
    from_port  = 0
    protocol   = "all"
    rule_no    = 100
    to_port    = 0
  }

  tags = {
    Name = "SR-US-EAST-1-PUBLIC-ACL-${var.environment}"
  }
}

resource "aws_security_group" "elb" {
  name_prefix = "SR-ELB-${var.environment}-"
  description = "ALB/ELB Default Security Group"

  vpc_id = aws_vpc.dev.id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "RAC-ELB-${var.environment}"
  }
}

resource "aws_security_group" "ec2" {
  name_prefix = "SR-EC2-${var.environment}-"
  description = "EC2 Default Security Group"

  vpc_id = aws_vpc.dev.id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "SR-EC2-${var.environment}"
  }
}

resource "aws_security_group_rule" "lb_80" {
  type                     = "ingress"
  source_security_group_id = aws_security_group.elb.id
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  description              = "ELB"
  security_group_id        = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "lb_443" {
  type                     = "ingress"
  source_security_group_id = aws_security_group.elb.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  description              = "ELB"
  security_group_id        = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "elb_egress" {
  type              = "egress"
  security_group_id = aws_security_group.elb.id
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  description       = "Egress All"
}

resource "aws_security_group_rule" "ec2_egress" {
  type              = "egress"
  security_group_id = aws_security_group.ec2.id
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  description       = "Egress All"
}

resource "aws_security_group_rule" "ec2_self" {
  type              = "ingress"
  security_group_id = aws_security_group.ec2.id
  self              = true
  from_port         = 0
  to_port           = 0
  protocol          = "tcp"
  description       = "EC2 to EC2"
}

resource "aws_security_group_rule" "ec2_ssh" {
  type              = "ingress"
  security_group_id = aws_security_group.ec2.id
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  description       = "SSH"
}

#resource "aws_vpc_endpoint" "s3" {
#  vpc_id            = aws_vpc.dev.id
#  service_name      = "com.amazonaws.${var.aws_region}.s3"
#  vpc_endpoint_type = "Gateway"
#}

#resource "aws_vpc_endpoint" "ec2" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ec2"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ec2messages" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ec2messages"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ecs" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ecs"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ecr_dkr" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ecr.dkr"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ecr_api" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ecr.api"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "lambda" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.lambda"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "rds" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.rds"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "rds_data" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.rds-data"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "sqs" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.sqs"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ssm" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ssm"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint" "ssmmessages" {
#  vpc_id             = aws_vpc.dev.id
#  service_name       = "com.amazonaws.${var.aws_region}.ssmmessages"
#  vpc_endpoint_type  = "Interface"
#  security_group_ids = [aws_security_group.ec2.id]
#}

#resource "aws_vpc_endpoint_route_table_association" "s3_a" {
#  route_table_id  = aws_route_table.private_a.id
#  vpc_endpoint_id = aws_vpc_endpoint.s3.id
#}

#resource "aws_vpc_endpoint_route_table_association" "s3_b" {
#  route_table_id  = aws_route_table.private_b.id
#  vpc_endpoint_id = aws_vpc_endpoint.s3.id
#}

#resource "aws_vpc_endpoint_route_table_association" "s3_c" {
#  route_table_id  = aws_route_table.private_c.id
#  vpc_endpoint_id = aws_vpc_endpoint.s3.id
#}

#resource "aws_vpc_endpoint_route_table_association" "s3_d" {
#  route_table_id  = aws_route_table.private_d.id
#  vpc_endpoint_id = aws_vpc_endpoint.s3.id
#}

#resource "aws_vpc_endpoint_route_table_association" "s3_pub" {
#  route_table_id  = aws_route_table.public.id
#  vpc_endpoint_id = aws_vpc_endpoint.s3.id
#}

#resource "aws_vpc_endpoint_subnet_association" "lambda_private_az1" {
#  vpc_endpoint_id = aws_vpc_endpoint.lambda.id
#  subnet_id       = aws_subnet.private_az1.id
#}

#resource "aws_vpc_endpoint_subnet_association" "lambda_private_az2" {
#  vpc_endpoint_id = aws_vpc_endpoint.lambda.id
#  subnet_id       = aws_subnet.private_az2.id
#}

#resource "aws_vpc_endpoint_subnet_association" "lambda_private_az3" {
#  vpc_endpoint_id = aws_vpc_endpoint.lambda.id
#  subnet_id       = aws_subnet.private_az3.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_private_az1" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds.id
#  subnet_id       = aws_subnet.private_az1.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_private_az2" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds.id
#  subnet_id       = aws_subnet.private_az2.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_private_az3" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds.id
#  subnet_id       = aws_subnet.private_az3.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_data_private_az1" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds_data.id
#  subnet_id       = aws_subnet.private_az1.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_data_private_az2" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds_data.id
#  subnet_id       = aws_subnet.private_az2.id
#}

#resource "aws_vpc_endpoint_subnet_association" "rds_data_private_az3" {
#  vpc_endpoint_id = aws_vpc_endpoint.rds_data.id
#  subnet_id       = aws_subnet.private_az3.id
#}
