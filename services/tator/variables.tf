variable "aws_region" {
  default = "us-east-1"
}

variable "sr_tator_version" {
  description = "The version tag for Tator"
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

variable "sr_db_secret_name" {
  type = string
}

variable "sr_logging_level" {
  type = string
}

variable "tator_websocket_event_bridge_lambda_src_dir" {
  type = string
}

variable "tator_websocket_event_bridge_lambda_payload_dir" {
  type = string
}

variable "tator_websocket_connect_lambda_src_dir" {
  type = string
}

variable "tator_websocket_connect_lambda_payload_dir" {
  type = string
}

variable "tator_websocket_default_lambda_src_dir" {
  type = string
}

variable "tator_websocket_default_lambda_payload_dir" {
  type = string
}

variable "tator_websocket_disconnect_lambda_src_dir" {
  type = string
}

variable "tator_websocket_disconnect_lambda_payload_dir" {
  type = string
}

variable "tator_sqs_lambda_src_dir" {
  type = string
}

variable "tator_sqs_lambda_payload_dir" {
  type = string
}

variable "tator_ddb_stream_lambda_src_dir" {
  type = string
}

variable "tator_ddb_stream_lambda_payload_dir" {
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

variable "enable_lambda_provisioned" {
  type        = bool
  default     = true
  description = "Enable provisioning on Lambda functions."
}
