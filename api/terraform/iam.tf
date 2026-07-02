resource "aws_iam_role" "stackref_main_api" {
  name = "stackref_main_api"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_policy" "stackref_main_lambda" {
  name = "stackref_main_lambda"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "logs:CreateLogGroup",
        "Resource" : "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        "Sid" : "SecretsManagerDbCredentialsAccess",
        "Effect" : "Allow",
        "Action" : "secretsmanager:GetSecretValue",
        "Resource" : "${data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn}"
      },
      {
        "Sid" : "SSMParametersAccess",
        "Effect" : "Allow",
        "Action" : [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        "Resource" : [
          "${data.terraform_remote_state.ssm.outputs.aws_scim_url_arn}",
          "${data.terraform_remote_state.ssm.outputs.aws_scim_token_arn}",
          "${data.terraform_remote_state.ssm.outputs.stripe_api_key_dev_arn}",
          "${data.terraform_remote_state.ssm.outputs.stripe_endpoint_secret_dev_arn}",
          "${data.terraform_remote_state.ssm.outputs.stripe_api_key_prod_arn}",
          "${data.terraform_remote_state.ssm.outputs.stripe_endpoint_secret_prod_arn}",
          "${data.terraform_remote_state.ssm.outputs.openapi_api_key_arn}"
        ]
      },
      {
        "Sid" : "AllowLoggingToCloudWatch",
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*"
        ]
      },
      {
        "Sid" : "AllowAccessToSSOService",
        "Effect" : "Allow",
        "Action" : [
          "sso:DeleteInlinePolicyFromPermissionSet",
          "sso:DescribePermissionSet",
          "sso:GetInlinePolicyForPermissionSet",
          "sso:ListPermissionSetsProvisionedToAccount",
          "sso:ListPermissionSetProvisioningStatus",
          "sso:ProvisionPermissionSet",
          "sso:PutInlinePolicyToPermissionSet",
          "sso:UpdatePermissionSet"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "AllowAccessToEventRulesAndScheduler",
        "Effect" : "Allow",
        "Action" : [
          "events:*",
          "scheduler:*"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "AllowTagging",
        "Effect" : "Allow",
        "Action" : [
          "tag:TagResources"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "AllowTatorKickoffSQS",
        "Effect" : "Allow",
        "Action" : [
          "sqs:*"
        ],
        "Resource" : [
          "${data.terraform_remote_state.tator.outputs.sqs_queue_arn}",
          "${data.terraform_remote_state.kickoff.outputs.sqs_queue_arn}"
        ]
      },
      {
        "Sid" : "AllowAssumeRoleSRAccounts",
        "Effect" : "Allow",
        "Action" : "sts:AssumeRole",
        "Resource" : [
          "${var.sr_analysis_codescans_role_arn}",
          "${var.sr_marketplace_role_arn}"
        ]
      },
      {
        "Sid" : "AllowPassKickoffSchedulerRole",
        "Effect" : "Allow",
        "Action" : [
          "iam:GetRole",
          "iam:PassRole"
        ],
        "Resource" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/kickoff_scheduler"
      },
      {
        "Sid" : "AllowAwsMarketplace",
        "Effect" : "Allow",
        "Action" : [
          "aws-marketplace:ResolveCustomer"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "AllowS3",
        "Effect" : "Allow",
        "Action" : [
          "s3:*"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "AllowSQS",
        "Effect" : "Allow",
        "Action" : [
          "sqs:*"
        ],
        "Resource" : [
          "arn:aws:sqs:us-east-1:000000000000:org-invitations-queue-dev",
          "arn:aws:sqs:us-east-1:000000000000:org-invitations-deadletter-queue-dev"
        ]
      },
      {
        "Sid" : "AllowInvokeLambda",
        "Effect" : "Allow",
        "Action" : "lambda:InvokeFunction",
        "Resource" : "*"
      },
      {
        "Sid" : "AllowLambdaXray",
        "Effect" : "Allow",
        "Action" : [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "stackref_main_lambda" {
  role       = aws_iam_role.stackref_main_api.name
  policy_arn = aws_iam_policy.stackref_main_lambda.arn
}

resource "aws_iam_policy" "permit_lambda_ses" {
  name = "permit_lambda_ses"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Resource" : "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*",
        "Action" : [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "stackref_main_api_permit_lambda_ses" {
  role       = aws_iam_role.stackref_main_api.name
  policy_arn = aws_iam_policy.permit_lambda_ses.arn
}

resource "aws_iam_role_policy_attachment" "stackref_main_api_AmazonAPIGatewayPushToCloudWatchLogs" {
  role       = aws_iam_role.stackref_main_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_iam_role_policy_attachment" "stackref_main_api_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.stackref_main_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
