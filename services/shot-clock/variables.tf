variable "aws_region" {
  default = "us-east-1"
}

variable "sr_shot_clock_version" {
  description = "The version tag for Shot Clock"
  type        = string
}

variable "environment" {
  type = string
}

variable "sr_db_arn" {
  type = string
}
variable "sr_db_name" {
  type = string
}

variable "sr_logging_level" {
  type = string
}

variable "amazon_mkt_meter_lambda_src_dir" {
  type = string
}

variable "amazon_mkt_meter_lambda_payload_dir" {
  type = string
}

variable "process_invitation_list_lambda_src_dir" {
  type = string
}

variable "process_invitation_list_lambda_payload_dir" {
  type = string
}

variable "python_lambda_layer_dir" {
  type = string
}

variable "sr_marketplace_role_arn" {
  type        = string
  description = "The role for Lambda to assume in stackref-marketplace"
}

variable "sr_aws_marketplace_product_code" {
  type        = string
  description = "The ProductCode assigned to the StackRef product in AWS Marketplace"
}
