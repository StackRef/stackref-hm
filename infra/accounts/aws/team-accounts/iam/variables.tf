variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "team_account_number" {
  type        = string
  default     = "000000000000"
  description = "The account number to apply this to. Default is stackref-core which should be used for output use only."
}

variable "tator_event_bridge_lambda_role_arn" {
  type        = string
  description = "The Lambda role that Tator EventBridge lambda runs as"
}

