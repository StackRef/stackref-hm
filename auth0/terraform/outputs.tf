output "prod_client_id" {
  value = auth0_client.prod.client_id
}

# output "beta_client_id" {
#   value = auth0_client.beta.client_id
# }

output "dev_client_id" {
  value = auth0_client.dev.client_id
}

# output "local_client_id" {
#   value = auth0_client.local.client_id
# }

output "client_ids" {
  value = [
    auth0_client.prod.client_id,
    # auth0_client.beta.client_id,
    auth0_client.dev.client_id,
    # auth0_client.local.client_id
  ]
}
