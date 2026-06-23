data "aws_ami_ids" "stackref_owned" {
  owners = ["self"]

  filter {
    name   = "name"
    values = ["sr-*"]
  }

  filter {
    name   = "tag:stackref:authorized_ami"
    values = ["true"]
  }
}

# Flatten an object such that we can apply the aws_ami_launch_permission for each aws_ami_ids
# we return, to each team_account_ids we grab from the organization remote_state.
locals {
  amis_to_accounts = flatten([
    for ami_id in toset(data.aws_ami_ids.stackref_owned.ids) : [
      for account_id in toset(data.terraform_remote_state.organization.outputs.team_account_ids) : {
        ami_id     = ami_id
        account_id = account_id
      }
    ]
  ])
}

resource "aws_ami_launch_permission" "stackref_owned" {
  for_each = {
    for amis_to_accounts in local.amis_to_accounts : "${amis_to_accounts.ami_id}.${amis_to_accounts.account_id}" => amis_to_accounts
  }

  image_id   = each.value.ami_id
  account_id = each.value.account_id
}
