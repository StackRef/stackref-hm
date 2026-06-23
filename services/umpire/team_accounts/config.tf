resource "aws_config_aggregate_authorization" "stackref_core" {
  account_id = var.org_account_number
  region     = var.aws_region
}

resource "aws_config_configuration_recorder" "umpire" {
  name     = var.team_account_name
  role_arn = aws_iam_service_linked_role.aws_config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "umpire" {
  name           = "umpire"
  s3_bucket_name = aws_s3_bucket.stackref-team-us-east-1-umpire.bucket
  depends_on = [
    aws_config_configuration_recorder.umpire
  ]
}

resource "aws_config_configuration_recorder_status" "umpire" {
  name       = aws_config_configuration_recorder.umpire.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.umpire]
}

resource "aws_config_config_rule" "account_part_of_organizations" {
  name        = "account-part-of-organizations"
  description = "Rule checks whether AWS account is part of AWS Organizations. The rule is NON_COMPLIANT if the AWS account is not part of AWS Organizations or AWS Organizations master account ID does not match rule parameter MasterAccountId."

  source {
    owner             = "AWS"
    source_identifier = "ACCOUNT_PART_OF_ORGANIZATIONS"
  }

  input_parameters = jsonencode({
    MasterAccountId = var.org_account_number
  })

  maximum_execution_frequency = "TwentyFour_Hours"

  depends_on = [aws_config_configuration_recorder.umpire]
}

resource "aws_config_config_rule" "ebs_volume_type" {
  name        = "ebs-volume-type"
  description = "Rule checks whether a created EBS volume is of specific types"

  scope {
    compliance_resource_types = [
      "AWS::EC2::Volume"
    ]
  }

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = "arn:aws:lambda:${var.aws_region}:${var.org_account_number}:function:Umpire"

    source_detail {
      message_type = "ConfigurationItemChangeNotification"
    }
  }


  depends_on = [aws_config_configuration_recorder.umpire]
}
