data "aws_ami" "amazon_linux_2" {
  most_recent = true

  owners = ["000000000000"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_instance" "webserver" {
  ami                         = data.aws_ami.amazon_linux_2.id
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.webserver.name
  instance_type               = "t3.small"
  key_name                    = var.ec2_key_name
  monitoring                  = false
  subnet_id                   = data.terraform_remote_state.vpc.outputs.public_subnet_a

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  root_block_device {
    volume_type = "gp2"
    volume_size = "20"
    encrypted   = false
  }

  lifecycle {
    ignore_changes = [ami]
  }

  volume_tags = {
    "Name" = "webserver-${var.environment}"
  }

  tags = {
    "Name"                       = "webserver-${var.environment}"
    "stackref:event_uuid"        = "ad71ad37-adca-4573-b20d-87a3277e94ac"
    "stackref:organization_uuid" = "c36dd258-023a-4068-aeab-990ee10e8869"
    "stackref:resource_name"     = "webserver-${var.environment}"
    "stackref:resource_uuid"     = "3e244f25-9899-4fee-a945-7fc7bf546d1b"
  }

}

resource "aws_lb_target_group" "webserver" {
  name     = "webserver-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.terraform_remote_state.vpc.outputs.vpc_dev
}

resource "aws_lb_target_group_attachment" "webserver" {
  target_group_arn = aws_lb_target_group.webserver.arn
  target_id        = aws_instance.webserver.id
  port             = 80
}

resource "aws_lb" "alb" {
  name               = "webserver-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.terraform_remote_state.vpc.outputs.elb_security_groups.us-east-1]
  subnets = [
    data.terraform_remote_state.vpc.outputs.public_subnet_a,
    data.terraform_remote_state.vpc.outputs.public_subnet_b,
    data.terraform_remote_state.vpc.outputs.public_subnet_c
  ]

  enable_deletion_protection = false
}

resource "aws_lb_listener" "elb_80" {
  load_balancer_arn = aws_lb.alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.webserver.arn
  }
}

resource "aws_lb_listener" "elb_443" {
  load_balancer_arn = aws_lb.alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
  certificate_arn   = data.aws_acm_certificate.stackref_com.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.webserver.arn
  }
}
