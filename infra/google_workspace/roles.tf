data "googleworkspace_role" "groups_admin" {
  name = "_GROUPS_ADMIN_ROLE"
}

data "googleworkspace_role" "super_admin" {
  name = "_SEED_ADMIN_ROLE"
}

resource "googleworkspace_role_assignment" "demo_super_admin" {
  role_id     = data.googleworkspace_role.super_admin.id
  assigned_to = googleworkspace_user.demo.id
}

#resource "googleworkspace_role_assignment" "tmorgan_super_admin" {
#  role_id     = data.googleworkspace_role.super_admin.id
#  assigned_to = googleworkspace_user.tmorgan.id
#}
