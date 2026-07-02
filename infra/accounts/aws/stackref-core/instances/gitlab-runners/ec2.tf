data "aws_ami" "stackref_base_arm64" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["sr-base-team-arm64-*"]
  }
}

data "aws_ami" "stackref_base_x86_64" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["sr-base-team-x86_64-*"]
  }
}

resource "aws_key_pair" "gitlab_runner" {
  key_name   = "gitlab_runner"
  public_key = file("${path.module}/gitlab_runner.pub")
}

resource "aws_instance" "gitlab_runner_arm" {
  ami                  = data.aws_ami.stackref_base_arm64.id
  iam_instance_profile = aws_iam_instance_profile.gitlab_runner.name
  instance_type        = "t4g.small"
  key_name             = aws_key_pair.gitlab_runner.key_name
  monitoring           = false
  subnet_id            = data.terraform_remote_state.vpc.outputs.public_subnet_a

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  tags = {
    Name = "gitlab-runner-${var.environment}-arm"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = "20"
    encrypted   = true

    tags = {
      Name = "gitlab-runner-${var.environment}-arm-root"
    }
  }

    lifecycle {
      ignore_changes = [ami, key_name]
    }

  provisioner "local-exec" {
    command = "sleep 180;ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -u ec2-user --private-key ${var.private_key_file} -i '${self.public_ip},' ${path.cwd}/ansible/gitlab_runner.yml"
  }
}

resource "aws_instance" "gitlab_runner_x86" {
  ami                  = data.aws_ami.stackref_base_x86_64.id
  iam_instance_profile = aws_iam_instance_profile.gitlab_runner.name
  instance_type        = "t3.small"
  key_name             = aws_key_pair.gitlab_runner.key_name
  monitoring           = false
  subnet_id            = data.terraform_remote_state.vpc.outputs.public_subnet_a

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  tags = {
    Name = "gitlab-runner-${var.environment}-x86"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = "20"
    encrypted   = true

    tags = {
      Name = "gitlab-runner-${var.environment}-x86-root"
    }
  }

  #  lifecycle {
  #    ignore_changes = [ami, tags]
  #  }

  provisioner "local-exec" {
    command = "sleep 180;ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -u ec2-user --private-key ${var.private_key_file} -i '${self.public_ip},' ${path.cwd}/ansible/gitlab_runner.yml"
  }
}

resource "aws_ebs_volume" "docker_x86" {
  availability_zone = "${var.aws_region}a"
  size              = 100
  type              = "gp3"
  encrypted         = true
}

resource "aws_volume_attachment" "docker_x86" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.docker_x86.id
  instance_id = aws_instance.gitlab_runner_x86.id
}
