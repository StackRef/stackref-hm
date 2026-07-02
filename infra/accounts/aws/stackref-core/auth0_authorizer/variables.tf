variable "aws_region" {
  default = "us-east-1"
}

variable "sr_authorizer_version" {
  type = string
}

variable "environment" {
  type = string
}

variable "sr_logging_level" {
  type = string
}

variable "lambda_src_dir" {
  type = string
}

variable "lambda_payload_dir" {
  type = string
}

variable "sr_auth0_domain" {
  type = string
}

variable "sr_auth0_client_id" {
  type      = string
  sensitive = true
}

#variable "sr_auth0_client_ids" {
#  type      = list(string)
#  sensitive = true
#}

variable "sr_auth0_be_audience" {
  type      = string
  sensitive = true
}
