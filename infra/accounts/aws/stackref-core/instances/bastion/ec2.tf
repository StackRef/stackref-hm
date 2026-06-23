data "aws_ami" "stackref_base" {
  most_recent = true
  owners      = ["000000000000"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-arm64*"]
  }
}

resource "aws_instance" "bastion" {
  ami                  = data.aws_ami.stackref_base.id
  iam_instance_profile = aws_iam_instance_profile.bastion.name
  instance_type        = "t4g.small"
  key_name             = var.ec2_key_name
  monitoring           = false
  subnet_id            = data.terraform_remote_state.vpc.outputs.public_subnet_a

  vpc_security_group_ids = [
    aws_security_group.ec2.id
  ]

  root_block_device {
    volume_type = "gp3"
    volume_size = "8"
    encrypted   = true

    tags = {
      Name = "bastion-${var.environment}-root"
    }
  }


  lifecycle {
    ignore_changes = [ami, tags]
  }

#  provisioner "local-exec" {
#    command = "sleep 180;ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -u ec2-user --private-key ${var.private_key_file} -i '${self.public_ip},' ${path.cwd}/ansible/bastion.yml"
#  }

}

resource "aws_ebs_volume" "docker" {
  availability_zone = "${var.aws_region}a"
  size              = 100
  type              = "gp3"
  encrypted         = true
}

resource "aws_volume_attachment" "docker" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.docker.id
  instance_id = aws_instance.bastion.id
}
