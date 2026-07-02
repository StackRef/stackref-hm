variable "sr_api_version" {
  description = "The version tag for the StackRef API"
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type = string
}

variable "python_lambda_layer_dir" {
  type = string
}

variable "stackcash_purchase_lambda_src_dir" {
  type = string
}

variable "stackcash_purchase_lambda_payload_dir" {
  type = string
}

variable "amzn_mkt_entitlement_lambda_src_dir" {
  type = string
}

variable "amzn_mkt_entitlement_lambda_payload_dir" {
  type = string
}

variable "asset_create_lambda_src_dir" {
  type = string
}

variable "asset_create_lambda_payload_dir" {
  type = string
}

variable "asset_delete_lambda_src_dir" {
  type = string
}

variable "asset_delete_lambda_payload_dir" {
  type = string
}

variable "asset_read_lambda_src_dir" {
  type = string
}

variable "asset_read_lambda_payload_dir" {
  type = string
}

variable "cloud_account_read_lambda_src_dir" {
  type = string
}

variable "cloud_account_read_lambda_payload_dir" {
  type = string
}

variable "cloud_account_update_lambda_src_dir" {
  type = string
}

variable "cloud_account_update_lambda_payload_dir" {
  type = string
}

variable "cloud_account_user_create_lambda_src_dir" {
  type = string
}

variable "cloud_account_user_create_lambda_payload_dir" {
  type = string
}

variable "cloud_account_user_delete_lambda_src_dir" {
  type = string
}

variable "cloud_account_user_delete_lambda_payload_dir" {
  type = string
}

variable "cloud_account_user_update_lambda_src_dir" {
  type = string
}

variable "cloud_account_user_update_lambda_payload_dir" {
  type = string
}

variable "coin_bank_read_lambda_src_dir" {
  type = string
}

variable "coin_bank_read_lambda_payload_dir" {
  type = string
}

variable "coin_bank_update_lambda_src_dir" {
  type = string
}

variable "coin_bank_update_lambda_payload_dir" {
  type = string
}

variable "resource_data_lambda_src_dir" {
  type = string
}

variable "resource_data_lambda_payload_dir" {
  type = string
}

variable "service_data_lambda_src_dir" {
  type = string
}

variable "service_data_lambda_payload_dir" {
  type = string
}

variable "playbook_data_lambda_src_dir" {
  type = string
}

variable "playbook_data_lambda_payload_dir" {
  type = string
}

variable "generate_uuid_lambda_src_dir" {
  type = string
}

variable "generate_uuid_lambda_payload_dir" {
  type = string
}

variable "judging_criterion_create_lambda_src_dir" {
  type = string
}

variable "judging_criterion_create_lambda_payload_dir" {
  type = string
}

variable "judging_criterion_read_lambda_src_dir" {
  type = string
}

variable "judging_criterion_read_lambda_payload_dir" {
  type = string
}

variable "judging_criterion_update_lambda_src_dir" {
  type = string
}

variable "judging_criterion_update_lambda_payload_dir" {
  type = string
}

variable "organization_read_lambda_src_dir" {
  type = string
}

variable "organization_read_lambda_payload_dir" {
  type = string
}

variable "user_registration_lambda_src_dir" {
  type = string
}

variable "user_registration_lambda_payload_dir" {
  type = string
}

variable "get_user_lambda_src_dir" {
  type = string
}

variable "get_user_lambda_payload_dir" {
  type = string
}

variable "marketplace_read_lambda_src_dir" {
  type = string
}

variable "marketplace_read_lambda_payload_dir" {
  type = string
}

variable "organization_create_lambda_src_dir" {
  type = string
}

variable "organization_create_lambda_payload_dir" {
  type = string
}

variable "organization_update_lambda_payload_dir" {
  type = string
}

variable "organization_update_lambda_src_dir" {
  type = string
}

variable "organization_invitation_lambda_src_dir" {
  type = string
}

variable "organization_invitation_lambda_payload_dir" {
  type = string
}

variable "user_read_lambda_src_dir" {
  type = string
}

variable "user_read_lambda_payload_dir" {
  type = string
}

variable "user_update_lambda_src_dir" {
  type = string
}

variable "user_update_lambda_payload_dir" {
  type = string
}

variable "user_tag_read_lambda_src_dir" {
  type = string
}

variable "user_tag_read_lambda_payload_dir" {
  type = string
}

variable "event_create_lambda_src_dir" {
  type = string
}

variable "event_create_lambda_payload_dir" {
  type = string
}

variable "event_update_lambda_src_dir" {
  type = string
}

variable "event_update_lambda_payload_dir" {
  type = string
}

variable "event_read_lambda_src_dir" {
  type = string
}

variable "event_read_lambda_payload_dir" {
  type = string
}

variable "participant_create_lambda_src_dir" {
  type = string
}

variable "participant_create_lambda_payload_dir" {
  type = string
}

variable "participant_read_lambda_src_dir" {
  type = string
}

variable "participant_read_lambda_payload_dir" {
  type = string
}

variable "participant_update_lambda_src_dir" {
  type = string
}

variable "participant_update_lambda_payload_dir" {
  type = string
}

variable "team_analysis_read_lambda_src_dir" {
  type = string
}

variable "team_analysis_read_lambda_payload_dir" {
  type = string
}

variable "team_create_lambda_src_dir" {
  type = string
}

variable "team_create_lambda_payload_dir" {
  type = string
}

variable "team_event_feedback_read_lambda_src_dir" {
  type = string
}

variable "team_event_feedback_read_lambda_payload_dir" {
  type = string
}

variable "team_event_feedback_update_lambda_src_dir" {
  type = string
}

variable "team_event_feedback_update_lambda_payload_dir" {
  type = string
}

variable "team_read_lambda_src_dir" {
  type = string
}

variable "team_read_lambda_payload_dir" {
  type = string
}

variable "team_update_lambda_src_dir" {
  type = string
}

variable "team_update_lambda_payload_dir" {
  type = string
}

variable "team_member_create_lambda_src_dir" {
  type = string
}

variable "team_member_create_lambda_payload_dir" {
  type = string
}

variable "team_member_read_lambda_src_dir" {
  type = string
}

variable "team_member_read_lambda_payload_dir" {
  type = string
}

variable "team_member_update_lambda_src_dir" {
  type = string
}

variable "team_member_update_lambda_payload_dir" {
  type = string
}

variable "team_score_item_read_lambda_src_dir" {
  type = string
}

variable "team_score_item_read_lambda_payload_dir" {
  type = string
}

variable "team_score_item_update_lambda_src_dir" {
  type = string
}

variable "team_score_item_update_lambda_payload_dir" {
  type = string
}

variable "kanban_read_lambda_src_dir" {
  type = string
}

variable "kanban_read_lambda_payload_dir" {
  type = string
}

variable "kanban_update_lambda_src_dir" {
  type = string
}

variable "kanban_update_lambda_payload_dir" {
  type = string
}

variable "sr_db_name" {
  type = string
}

variable "sr_logging_level" {
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

variable "sr_max_invitation_send_count" {
  type    = number
  default = 3
}

variable "sr_kickoff_fn_arn" {
  type        = string
  description = "ARN of the Kickoff Lambda function"
}

variable "sentry_api_dsn" {
  type        = string
  description = "The DSN for Sentry to monitor the API Lambda functions"
}

variable "sr_analysis_codescans_role_arn" {
  type        = string
  description = "The role for Lambda to assume in stackref-analysis-codescans"
}

variable "sr_analysis_codescans_account_id" {
  type        = string
  description = "The AWS account ID of stackref-analysis-codescans"
}

variable "sr_kickoff_scheduler_role_arn" {
  type        = string
  description = "Role to allow iam:PassRole for EventBridge schedule creation/update"
}

variable "sr_marketplace_role_arn" {
  type        = string
  description = "The role for Lambda to assume in stackref-marketplace"
}

variable "sr_aws_marketplace_product_code" {
  type        = string
  description = "The ProductCode assigned to the StackRef product in AWS Marketplace"
}
