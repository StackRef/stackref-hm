data "aws_ami" "coach" {
  most_recent = true
  owners      = [var.org_account_number]

  filter {
    name   = "name"
    values = ["sr-coach-x86_64-prod-${var.coach_version}-*"]
  }
}

resource "aws_instance" "coach" {
  ami                         = data.aws_ami.coach.id
  associate_public_ip_address = true
  iam_instance_profile        = data.aws_iam_instance_profile.coach.name
  instance_type               = "t2.micro"
  monitoring                  = false
  subnet_id                   = element(random_shuffle.subnet.result, 0)

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  root_block_device {
    volume_type = "gp2"
    volume_size = "8"
    encrypted   = false
  }

  user_data = base64encode(templatefile("${path.module}/scripts/user-data.txt", {
    COACH_VERSION = var.coach_version
  }))

  # Ignore subnet changes since we randomly pick one at the start and don't want to re-assign that and
  # cause the instance to have to be rebuilt.
  lifecycle {
    ignore_changes = [
      subnet_id
    ]
  }

  tags = {
    Name                         = "StackRef Coach"
    terraform_managed            = "true"
    "stackref:coach_version"     = var.coach_version
    "stackref:organization_uuid" = var.organization_uuid
    "stackref:event_uuid"        = var.event_uuid
    "stackref:resource_name"     = "coach"
    "stackref:resource_uuid"     = uuid()
  }

  volume_tags = {
    Name                         = "StackRef Coach"
    terraform_managed            = "true"
    "stackref:coach_version"     = var.coach_version
    "stackref:organization_uuid" = var.organization_uuid
    "stackref:event_uuid"        = var.event_uuid
    "stackref:resource_name"     = "coach"
    "stackref:resource_uuid"     = uuid()
  }

}
