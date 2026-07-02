data "archive_file" "organization_invitation_lambda_payload" {
  type       = "zip"
  source_dir = var.organization_invitation_lambda_src_dir
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.organization_invitation_lambda_payload_dir}/payload.zip"
}

resource "aws_lambda_function" "organization_invitation" {
  filename         = data.archive_file.organization_invitation_lambda_payload.output_path
  function_name    = "organizationInvitation"
  description      = "Handles Organization User invitations"
  role             = aws_iam_role.stackref_main_api.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.organization_invitation_lambda_payload.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  publish          = "true"
  architectures    = ["arm64"]

  tracing_config {
    mode = "Active"
  }

  layers = [aws_lambda_layer_version.python_lambda_layer.arn]

  vpc_config {
    subnet_ids = [
      data.terraform_remote_state.vpc.outputs.private_subnet_a


    ]
    security_group_ids          = [aws_security_group.memcached_private.id]
    ipv6_allowed_for_dual_stack = true
  }

  #  lifecycle {
  #    ignore_changes = [
  #      source_code_hash
  #    ]
  #  }

  environment {
    variables = {
      SENTRY_ENVIRONMENT           = var.environment
      SENTRY_RELEASE               = var.sr_api_version
      SR_API_VERSION               = var.sr_api_version
      SR_DB_NAME                   = var.sr_db_name
      SR_DB_SECRET_ARN             = data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn
      SR_MEMCACHED_CFG_EP          = aws_elasticache_cluster.stackref_main.configuration_endpoint
      SR_LOGGING_LEVEL             = var.sr_logging_level
      SR_AUTH0_DOMAIN              = var.sr_auth0_domain
      SR_AUTH0_CLIENT_IDS          = jsonencode(data.terraform_remote_state.auth0.outputs.client_ids)
      SR_AUTH0_BE_AUDIENCE         = var.sr_auth0_be_audience
      SR_MAX_INVITATION_SEND_COUNT = var.sr_max_invitation_send_count
      SR_TATOR_SQS_URL             = data.terraform_remote_state.tator.outputs.sqs_queue_url
    }
  }
}

resource "aws_lambda_permission" "organization_invitation" {
  statement_id  = "AllowAPIGatewayInvoke-organizationInvitation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.organization_invitation.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stackref_main.execution_arn}/*/*/organizationInvitation"
}

resource "aws_lambda_permission" "shot_clock_org_invitations_sqs" {
  statement_id  = "AllowSQSInvoke-ShotClockOrgInvitationsSQS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.organization_invitation.arn
  principal     = "sqs.amazonaws.com"
  source_arn    = "arn:aws:sqs:us-east-1:000000000000:org-invitations-queue-dev"
}

resource "aws_lambda_permission" "shot_clock_org_invitations_sqs_deadletter" {
  statement_id  = "AllowSQSInvoke-ShotClockOrgInvitationsSQSDeadletter"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.organization_invitation.arn
  principal     = "sqs.amazonaws.com"
  source_arn    = "arn:aws:sqs:us-east-1:000000000000:org-invitations-deadletter-queue-dev"
}

resource "aws_lambda_event_source_mapping" "shot_clock_org_invitations_sqs" {
  event_source_arn = "arn:aws:sqs:us-east-1:000000000000:org-invitations-queue-dev"
  function_name    = aws_lambda_function.organization_invitation.arn
}

resource "aws_lambda_event_source_mapping" "shot_clock_org_invitations_sqs_deadletter" {
  event_source_arn = "arn:aws:sqs:us-east-1:000000000000:org-invitations-deadletter-queue-dev"
  function_name    = aws_lambda_function.organization_invitation.arn
}
