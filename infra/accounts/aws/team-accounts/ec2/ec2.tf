data "aws_ami_ids" "stackref_owned" {
  owners = [var.org_account_number]

  filter {
    name   = "name"
    values = ["sr-*-prod-*"]
  }
}

resource "aws_ec2_tag" "stackref_authorized_ami" {
  for_each = toset(data.aws_ami_ids.stackref_owned.ids)

  resource_id = each.value
  key         = "stackref:authorized_ami"
  value       = "true"
}
