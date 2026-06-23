output "vpc_dev" {
  value = aws_vpc.dev.id
}

output "vpc_cidr" {
  value = var.vpc_cidr
}

output "private_subnet_a" {
  value = aws_subnet.private_az1.id
}

output "private_subnet_b" {
  value = aws_subnet.private_az2.id
}

output "private_subnet_c" {
  value = aws_subnet.private_az3.id
}

output "private_subnet_d" {
  value = aws_subnet.private_az4.id
}

output "public_subnet_a" {
  value = aws_subnet.public_az1.id
}

output "public_subnet_b" {
  value = aws_subnet.public_az2.id
}

output "public_subnet_c" {
  value = aws_subnet.public_az3.id
}

output "public_subnet_d" {
  value = aws_subnet.public_az4.id
}

output "elb_sg" {
  value = aws_security_group.elb.id
}

output "ec2_sg" {
  value = aws_security_group.ec2.id
}

output "private_subnet_a_rt" {
  value = aws_route_table.private_a.id
}

output "private_subnet_b_rt" {
  value = aws_route_table.private_b.id
}

output "dev_igw" {
  value = aws_internet_gateway.dev.id
}

output "public_subnets" {
  value = {
    "us-east-1" = [aws_subnet.public_az1.id, aws_subnet.public_az2.id, aws_subnet.public_az3.id]
  }
}

output "private_subnets" {
  value = {
    "us-east-1" = [aws_subnet.private_az1.id, aws_subnet.private_az2.id, aws_subnet.private_az3.id]
  }
}

output "vpcs" {
  value = {
    "us-east-1" = "${aws_vpc.dev.id}"
  }
}

output "ec2_security_groups" {
  value = {
    "us-east-1" = "${aws_security_group.ec2.id}"
  }
}

output "elb_security_groups" {
  value = {
    "us-east-1" = "${aws_security_group.elb.id}"
  }
}

