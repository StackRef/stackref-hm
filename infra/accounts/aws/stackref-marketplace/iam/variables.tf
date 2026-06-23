variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "sr_core_account_id" {
  type        = string
  description = "AWS Account ID of stackref-core"
}
