data "archive_file" "process_invitation_list_lambda_payload" {
  type       = "zip"
  source_dir = var.process_invitation_list_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.process_invitation_list_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "process_invitation_list" {
  filename         = data.archive_file.process_invitation_list_lambda_payload.output_path
  function_name    = "processInvitationList"
  description      = "Handles Organization invitation list uploads"
  role             = aws_iam_role.shot_clock_lambda.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.process_invitation_list_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  publish          = "true"
  architectures    = ["arm64"]

  layers = [
    aws_lambda_layer_version.python_lambda_layer.arn
  ]

  vpc_config {
    subnet_ids = [
      data.terraform_remote_state.vpc.outputs.private_subnet_a


    ]
    security_group_ids = [data.aws_security_group.memcached_private.id]
  }

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SR_SHOT_CLOCK_VERSION      = var.sr_shot_clock_version
      SR_DB_NAME                 = var.sr_db_name
      SR_DB_SECRET_ARN           = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP        = data.aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL           = var.sr_logging_level
      SR_ORG_INVITATIONS_SQS_URL = aws_sqs_queue.org_invitations.id
      SR_TATOR_SQS_URL           = data.terraform_remote_state.tator.outputs.sqs_queue_url
    }
  }
}

resource "aws_lambda_permission" "entity_assets_bucket" {
  statement_id  = "AllowExecutionFromEntityAssetsS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_invitation_list.arn
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::stackref-entity-assets"
}
