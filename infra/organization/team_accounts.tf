resource "aws_organizations_organizational_unit" "team_accounts" {
  name      = "teams"
  parent_id = aws_organizations_organization.stackref.roots[0].id
}

resource "aws_organizations_account" "stackref-team" {
  count = var.team_accounts_count
  name  = "stackref-team-${format("%03g", count.index + 1)}"
  email = "team-account-${format("%03g", count.index + 1)}@${var.stackref_email_domain}"

  parent_id = aws_organizations_organizational_unit.team_accounts.id

  tags = {
    team                          = "${format("%03g", count.index + 1)}"
    "stackref:cloud_account_uuid" = random_uuid.cloud_account_uuid[count.index].result
  }
}

resource "random_uuid" "cloud_account_uuid" {
  count = var.team_accounts_count
}

resource "aws_organizations_policy_attachment" "baseline_deny_1" {
  policy_id = aws_organizations_policy.baseline_deny_1.id
  target_id = aws_organizations_organizational_unit.team_accounts.id
}

resource "aws_organizations_policy_attachment" "baseline_deny_2" {
  policy_id = aws_organizations_policy.baseline_deny_2.id
  target_id = aws_organizations_organizational_unit.team_accounts.id
}

# Doing this for now, at least during beta period
resource "aws_organizations_policy_attachment" "regular_season" {
  policy_id = aws_organizations_policy.regular_season.id
  target_id = aws_organizations_organizational_unit.team_accounts.id
}
