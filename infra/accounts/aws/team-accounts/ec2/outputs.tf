output "team_account_ids" {
  value     = data.terraform_remote_state.organization.outputs.team_account_ids
  sensitive = true
}

output "this_account_id" {
  value = var.team_account_number
}
