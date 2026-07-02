variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "team_account_number" {
  type        = string
  description = "The account number to apply this to"
}

variable "team_account_name" {
  type        = string
  description = "The name of the team account that matches the team_account_number"
}

variable "org_account_number" {
  type        = string
  default     = "000000000000"
  description = "Main StackRef organization account number"
}
