data "gitlab_user" "users" {
  for_each = var.users

  username = each.value.username
}

resource "gitlab_group_membership" "group_members" {
  for_each = data.gitlab_user.users

  group_id     = data.gitlab_group.stackref.id
  user_id      = each.value.id
  access_level = var.users[each.value.username].group_access_level
}
