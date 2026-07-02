#resource "gitlab_branch" "main" {
#  for_each = gitlab_project.project
#
#  project = each.value.id
#  name    = "main"
#  ref     = ""
#}

#resource "gitlab_branch" "develop" {
#  for_each = gitlab_project.project
#
#  project = each.value.id
#  name    = "develop"
#  ref     = ""
#}

resource "gitlab_branch_protection" "develop" {
  for_each = gitlab_project.project

  project                      = each.value.id
  branch                       = "develop"
  push_access_level            = "developer"
  merge_access_level           = "developer"
  unprotect_access_level       = "maintainer"
  allow_force_push             = false
  code_owner_approval_required = false
}

resource "gitlab_branch_protection" "main" {
  for_each = gitlab_project.project

  project                      = each.value.id
  branch                       = "main"
  push_access_level            = "maintainer"
  merge_access_level           = "maintainer"
  unprotect_access_level       = "maintainer"
  allow_force_push             = false
  code_owner_approval_required = false
}
