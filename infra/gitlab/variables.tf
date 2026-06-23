variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_default_region" {
  type = string
}

variable "aws_access_key_id" {
  type      = string
  sensitive = true
}

variable "aws_secret_access_key" {
  type      = string
  sensitive = true
}

variable "gitlab_runner_id" {
  type = string
}

variable "gitlab_token" {
  type      = string
  sensitive = true
}

variable "projects" {
  type = map(any)
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
}

variable "snyk_token" {
  type      = string
  sensitive = true
}

variable "users" {
  type = map(any)
}
