variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type = string
}

variable "sradmin_db_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "sr_api_db_password" {
  type      = string
  default   = ""
  sensitive = true
}
