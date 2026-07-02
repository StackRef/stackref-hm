variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_scim_url" {
  type      = string
  sensitive = true
}

variable "aws_scim_token" {
  type      = string
  sensitive = true
}

variable "stripe_api_key_dev" {
  type      = string
  sensitive = true
}

variable "stripe_endpoint_secret_dev" {
  type      = string
  sensitive = true
}

variable "stripe_api_key_prod" {
  type      = string
  sensitive = true
}

variable "stripe_endpoint_secret_prod" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}
