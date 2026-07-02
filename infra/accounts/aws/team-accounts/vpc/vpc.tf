resource "aws_vpc" "stackref" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true

  tags = {
    Name = "stackref"
  }
}

resource "aws_subnet" "private_az1" {
  vpc_id            = aws_vpc.stackref.id
  cidr_block        = var.private_subnet_1
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "Private-AZ1"
  }
}

resource "aws_subnet" "private_az2" {
  vpc_id            = aws_vpc.stackref.id
  cidr_block        = var.private_subnet_2
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "Private-AZ2"
  }
}

resource "aws_subnet" "private_az3" {
  vpc_id            = aws_vpc.stackref.id
  cidr_block        = var.private_subnet_3
  availability_zone = "${var.aws_region}c"

  tags = {
    Name = "Private-AZ3"
  }
}

resource "aws_subnet" "private_az4" {
  vpc_id            = aws_vpc.stackref.id
  cidr_block        = var.private_subnet_4
  availability_zone = "${var.aws_region}d"

  tags = {
    Name = "Private-AZ4"
  }
}

resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.stackref.id
  cidr_block              = var.public_subnet_1
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ1"
  }
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.stackref.id
  cidr_block              = var.public_subnet_2
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ2"
  }
}

resource "aws_subnet" "public_az3" {
  vpc_id                  = aws_vpc.stackref.id
  cidr_block              = var.public_subnet_3
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ3"
  }
}

resource "aws_subnet" "public_az4" {
  vpc_id                  = aws_vpc.stackref.id
  cidr_block              = var.public_subnet_4
  availability_zone       = "${var.aws_region}d"
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-AZ4"
  }
}

resource "aws_internet_gateway" "stackref" {
  vpc_id = aws_vpc.stackref.id

  tags = {
    Name = "SR-US-EAST-1-IGW"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.stackref.id

  tags = {
    Name = "Route-Private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.stackref.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.stackref.id
  }

  tags = {
    Name = "Route-Public"
  }
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

resource "aws_main_route_table_association" "public_main" {
  vpc_id         = aws_vpc.stackref.id
  route_table_id = aws_route_table.private.id
}

resource "aws_vpc_dhcp_options" "stackref" {
  domain_name         = "${var.aws_region}.compute.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = {
    Name = "SR-US-EAST-1-DHCP"
  }
}

resource "aws_vpc_dhcp_options_association" "stackref" {
  vpc_id          = aws_vpc.stackref.id
  dhcp_options_id = aws_vpc_dhcp_options.stackref.id
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.stackref.id
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
    Name = "SR-US-EAST-1-PRIVATE-ACL"
  }
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.stackref.id
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
    Name = "SR-US-EAST-1-PUBLIC-ACL"
  }
}

resource "aws_security_group" "elb" {
  name_prefix = "SR-ELB-"
  description = "ALB/ELB Default Security Group"

  vpc_id = aws_vpc.stackref.id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "RAC-ELB"
  }
}

resource "aws_security_group" "ec2" {
  name_prefix = "SR-EC2-"
  description = "EC2 Default Security Group"

  vpc_id = aws_vpc.stackref.id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "SR-EC2"
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
