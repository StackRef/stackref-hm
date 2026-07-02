data "gitlab_group" "stackref" {
  full_path = "stackref"
}

#resource "gitlab_group_badge" "stackref" {
#  group     = data.gitlab_group.stackref.id
#  image_url = "https://gitlab.com/uploads/-/system/group/avatar/10279935/final-fat-hands-logo-only-med.png?width=64"
#}

resource "gitlab_group_variable" "aws_access_key_id" {
  group             = data.gitlab_group.stackref.id
  key               = "AWS_ACCESS_KEY_ID"
  value             = var.aws_access_key_id
  protected         = false
  masked            = false
  environment_scope = "*"
}

resource "gitlab_group_variable" "aws_secret_access_key" {
  group             = data.gitlab_group.stackref.id
  key               = "AWS_SECRET_ACCESS_KEY"
  value             = var.aws_secret_access_key
  protected         = false
  masked            = true
  environment_scope = "*"
}

resource "gitlab_group_variable" "aws_default_region" {
  group             = data.gitlab_group.stackref.id
  key               = "AWS_DEFAULT_REGION"
  value             = var.aws_default_region
  protected         = false
  masked            = false
  environment_scope = "*"
}

resource "gitlab_group_variable" "snyk_token" {
  group             = data.gitlab_group.stackref.id
  key               = "SNYK_TOKEN"
  value             = var.snyk_token
  protected         = false
  masked            = false
  environment_scope = "*"
}

resource "gitlab_group_variable" "gitlab_runner_id" {
  group             = data.gitlab_group.stackref.id
  key               = "GITLAB_RUNNER_ID"
  value             = var.gitlab_runner_id
  protected         = false
  masked            = false
  environment_scope = "*"
}
