variable "aws_region" {
  default = "us-east-1"
  type    = string
}

variable "team_accounts_count" {
  type = number
}

variable "stackref_email_domain" {
  type    = string
  default = "example.com"
}
