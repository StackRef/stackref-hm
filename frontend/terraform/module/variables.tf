variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  type = string
}

variable "allowed_countries" {
  type    = list(any)
  default = ["US"]
}

variable "blocked_countries" {
  type    = list(any)
  default = ["CN", "KR", "RU"]
}


variable "api_version" {
  type    = string
  default = "v1"
}

variable "stackref_main_api_lambda_role" {
  type    = string
  default = "arn:aws:iam::000000000000:role/stackref_main_api"
}
