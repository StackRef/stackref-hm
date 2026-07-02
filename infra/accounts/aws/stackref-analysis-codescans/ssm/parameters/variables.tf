variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "snyk_token" {
  type      = string
  sensitive = true
}

variable "infracost_api_key" {
  type      = string
  sensitive = true
}

variable "cody_api_url" {
  type      = string
}

variable "cody_api_token" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}
