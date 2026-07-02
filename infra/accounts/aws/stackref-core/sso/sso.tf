data "aws_ssoadmin_instances" "stackref" {}

#resource "aws_ssoadmin_permission_set" "team_account_permission_boundary" {
#  name         = "TeamAccountPB"
#  instance_arn = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
#}

#resource "aws_ssoadmin_permissions_boundary_attachment" "team_account" {
#  instance_arn       = aws_ssoadmin_permission_set.team_account_permission_boundary.instance_arn
#  permission_set_arn = aws_ssoadmin_permission_set.team_account_permission_boundary.arn
#  permissions_boundary {
#    customer_managed_policy_reference {
#      name = aws_iam_policy.team_pb.name
#      path = "/stackref/team/"
#    }
#  }
#}

resource "aws_ssoadmin_permission_set" "administrator_access" {
  name         = "AdministratorAccess"
  description  = "Administrator Access"
  instance_arn = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
  #relay_state      = "https://s3.console.aws.amazon.com/s3/home?region=us-east-1#"
  session_duration = "PT12H"
}

resource "aws_ssoadmin_account_assignment" "stackref_core_administrators" {
  instance_arn       = aws_ssoadmin_permission_set.administrator_access.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.administrator_access.arn

  principal_id   = aws_identitystore_group.administrators.group_id
  principal_type = "GROUP"

  target_id   = data.aws_caller_identity.current.account_id
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_account_assignment" "stackref_core_team_accounts_administrators" {
  for_each = toset(data.terraform_remote_state.organization.outputs.team_account_ids)

  instance_arn       = aws_ssoadmin_permission_set.administrator_access.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.administrator_access.arn

  principal_id   = aws_identitystore_group.administrators.group_id
  principal_type = "GROUP"

  target_id   = each.value
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_managed_policy_attachment" "administrator_access" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
  permission_set_arn = aws_ssoadmin_permission_set.administrator_access.arn
}

resource "aws_ssoadmin_permission_set" "team_write_access" {
  for_each = { for ad in data.terraform_remote_state.organization.outputs.account_details : ad.cloud_account_name => ad }

  name         = "TeamWrite-${each.value.cloud_account_name}"
  description  = "Team Write Access ${each.value.cloud_account_name}"
  instance_arn = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
  #relay_state      = "https://s3.console.aws.amazon.com/s3/home?region=us-east-1#"
  session_duration = "PT1H"
}

resource "aws_ssoadmin_account_assignment" "team_writers" {
  for_each = { for ad in data.terraform_remote_state.organization.outputs.account_details : ad.cloud_account_name => ad }

  instance_arn       = aws_ssoadmin_permission_set.team_write_access[each.value.cloud_account_name].instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.team_write_access[each.value.cloud_account_name].arn

  principal_id   = aws_identitystore_group.team_write_access[each.value.cloud_account_name].group_id
  principal_type = "GROUP"

  target_id   = each.value.cloud_account_cloud_id
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_permissions_boundary_attachment" "team_player_standard" {
  for_each = aws_ssoadmin_permission_set.team_write_access

  instance_arn       = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
  permission_set_arn = each.value.arn
  permissions_boundary {
    customer_managed_policy_reference {
      name = aws_iam_policy.team_pb.name
      path = "/stackref/team/"
    }
  }
}

resource "aws_ssoadmin_customer_managed_policy_attachment" "team_player_standard_access" {
  for_each = aws_ssoadmin_permission_set.team_write_access

  instance_arn       = tolist(data.aws_ssoadmin_instances.stackref.arns)[0]
  permission_set_arn = each.value.arn
  customer_managed_policy_reference {
    name = aws_iam_policy.team_players_standard.name
    path = "/stackref/team/"
  }
}

## Groups

resource "aws_identitystore_group" "administrators" {
  display_name      = "Administrators"
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
}

resource "aws_identitystore_group" "readonly" {
  display_name      = "ReadOnly"
  description       = "Read Only User"
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
}

resource "aws_identitystore_group" "team_write_access" {
  for_each = resource.aws_ssoadmin_permission_set.team_write_access

  display_name      = each.value.name
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
}

## Users

resource "aws_identitystore_user" "demo_stackref_com" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
  display_name      = "Jordan Avery"
  user_name         = "admin@example.com"
  timezone          = "America/New_York"

  name {
    family_name = "Avery"
    given_name  = "Jordan"
  }

  emails {
    value   = "admin@example.com"
    type    = "work"
    primary = true
  }
}

resource "aws_identitystore_user" "stackref_core_stackref_com" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
  display_name      = "StackRef Core"
  user_name         = "stackref-core@example.com"
  timezone          = "America/New_York"

  name {
    family_name = "Core"
    given_name  = "StackRef"
  }

  emails {
    value   = "stackref-core@example.com"
    type    = "work"
    primary = true
  }
}

data "aws_identitystore_user" "stackref_core_stackref_com" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]

  alternate_identifier {
    unique_attribute {
      attribute_path  = "UserName"
      attribute_value = "stackref-core@example.com"
    }
  }
}

## Group Memberships

resource "aws_identitystore_group_membership" "stackref_core_administrators" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.stackref.identity_store_ids)[0]
  group_id          = aws_identitystore_group.administrators.group_id
  member_id         = aws_identitystore_user.stackref_core_stackref_com.user_id
}
