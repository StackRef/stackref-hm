resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  password_reuse_prevention      = 24
  max_password_age               = 89
}

## Groups

resource "aws_iam_group" "sr_admins" {
  name = "sr_admins"
}

resource "aws_iam_group_policy_attachment" "sr_admins_AdministratorAccess" {
  group      = aws_iam_group.sr_admins.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_group_policy_attachment" "sr_admins_Billing" {
  group      = aws_iam_group.sr_admins.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/Billing"
}

resource "aws_iam_group_policy_attachment" "sr_admins_IAMUserChangePassword" {
  group      = aws_iam_group.sr_admins.name
  policy_arn = "arn:aws:iam::aws:policy/IAMUserChangePassword"
}

## Users

resource "aws_iam_user" "demo" {
  name = "demo"
}

## Group Memberships

resource "aws_iam_group_membership" "sr_admins" {
  name = "sr_admins_members"

  users = [
    aws_iam_user.demo.name
  ]

  group = aws_iam_group.sr_admins.name
}
