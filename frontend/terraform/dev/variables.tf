variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "allowed_countries" {
  type = list(any)
  default = [
    "US"
  ]
}

variable "api_version" {
  type    = string
  default = "v1"
}
