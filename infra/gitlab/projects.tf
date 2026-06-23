resource "gitlab_project" "project" {
  for_each = var.projects

  name         = each.value.name
  path         = each.value.path
  description  = each.value.description
  namespace_id = data.gitlab_group.stackref.id

  default_branch                   = "develop"
  pipelines_enabled                = true
  shared_runners_enabled           = each.value.shared_runners_enabled
  remove_source_branch_after_merge = true
}
