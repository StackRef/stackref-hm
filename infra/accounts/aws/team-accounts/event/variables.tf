variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "coach_version" {
  type = string
  description = "Version of Coach to deploy"
}

variable "team_account_number" {
  type        = string
  description = "The account number to apply this to"
}

variable "org_account_number" {
  type        = string
  default     = "000000000000"
  description = "Main StackRef organization account number"
}

variable "organization_uuid" {
  type        = string
  description = "Customer organization UUID"
}

variable "event_uuid" {
  type        = string
  description = "Customer event UUID"
}
