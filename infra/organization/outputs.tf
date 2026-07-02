output "team_account_ids" {
  value = aws_organizations_account.stackref-team[*].id
}

#output "team_account_tags" {
#  value = aws_organizations_account.stackref-team[*].tags
#}

output "account_details" {
  value = [for k, v in aws_organizations_account.stackref-team[*] :
    {
      cloud_account_uuid        = v.tags["stackref:cloud_account_uuid"],
      cloud_account_name        = "stackref-team-${v.tags["team"]}"
      cloud_account_cloud_id    = v.id,
      cloud_account_provider_id = 1,
      cloud_account_owner_uuid  = "00000000-0000-0000-0000-000000000000",
      cloud_account_owner_type  = "team"
    }
  ]
}
