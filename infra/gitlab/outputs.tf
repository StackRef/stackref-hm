#output "tmorgan_id" {
#  value = data.gitlab_user.users["tmorgan3"].id
#}

output "user_ids" {
  value = [for u in data.gitlab_user.users : {
    username = u.username,
    id       = u.id
  }]
}
