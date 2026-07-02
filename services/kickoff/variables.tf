variable "aws_region" {
  default = "us-east-1"
}

variable "sr_kickoff_version" {
  description = "The version tag for Kickoff"
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

variable "kickoff_lambda_src_dir" {
  type = string
}

variable "kickoff_lambda_payload_dir" {
  type = string
}

variable "kickoff_sqs_lambda_src_dir" {
  type = string
}

variable "kickoff_sqs_lambda_payload_dir" {
  type = string
}

variable "kickoff_codescan_lambda_src_dir" {
  type = string
}

variable "kickoff_codescan_lambda_payload_dir" {
  type = string
}

variable "kickoff_record_results_lambda_src_dir" {
  type = string
}

variable "kickoff_record_results_lambda_payload_dir" {
  type = string
}

variable "sr_auth0_domain" {
  type = string
}

variable "sr_auth0_client_id" {
  type      = string
  sensitive = true
}

#variable "sr_auth0_client_ids" {
#  type      = list(string)
#  sensitive = true
#}

variable "sr_auth0_be_audience" {
  type      = string
  sensitive = true
}

variable "sr_analysis_codescans_role_arn" {
  type        = string
  description = "The role for Lambda to assume in stackref-analysis-codescans"
}

variable "sr_analysis_codescans_account_id" {
  type        = string
  description = "The AWS account ID of stackref-analysis-codescans"
}
