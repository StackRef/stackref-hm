variable "be_auth0_client_id" {
  type = string
}

variable "be_auth0_client_secret" {
  type      = string
  sensitive = true
}

variable "tf_auth0_domain" {
  type = string
}

variable "tf_auth0_client_id" {
  type = string
}

variable "tf_auth0_client_secret" {
  type      = string
  sensitive = true
}

variable "gitlab_application_id" {
  type = string
}

variable "gitlab_secret" {
  type      = string
  sensitive = true
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
}

variable "auth0_email_iam_access_key_id" {
  type      = string
  sensitive = true
}

variable "auth0_email_iam_secret_access_key" {
  type      = string
  sensitive = true
}

variable "github_application_id" {
  type = string
}

variable "github_secret" {
  type      = string
  sensitive = true
}

variable "google_application_id" {
  type = string
}

variable "google_secret" {
  type      = string
  sensitive = true
}

variable "sentry_dsn" {
  type      = string
  sensitive = true
}
