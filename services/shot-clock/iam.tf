resource "aws_iam_role" "shot_clock_lambda" {
  name = "shot_clock_lambda-${var.environment}"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : "lambda.amazonaws.com"
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_policy" "shot_clock_lambda" {
  name = "shot_clock_lambda-${var.environment}"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowLogToCloudWatch",
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/amazonMktMeter:*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/processInvitationList:*"
        ]
      },
      {
        "Sid" : "AllowWSDynamoTableAccess",
        "Effect" : "Allow",
        "Action" : [
          "dynamodb:DeleteItem",
          "dynamodb:Put*",
          "dynamodb:Get*",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ],
        "Resource" : "*"
      },
      {
        "Sid" : "SecretsManagerDbCredentialsAccess",
        "Effect" : "Allow",
        "Action" : [
          "secretsmanager:GetSecretValue"
        ],
        "Resource" : [
          "${data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn}"
        ]
      },
      {
        "Sid" : "AllowAssumeRoleSRAccounts",
        "Effect" : "Allow",
        "Action" : "sts:AssumeRole",
        "Resource" : [
          "${var.sr_marketplace_role_arn}"
        ]
      },
      {
        "Sid" : "AllowExecuteLambda",
        "Effect" : "Allow",
        "Action" : "lambda:InvokeFunction",
        "Resource" : "*"
      },
      {
        "Sid" : "AssetBucketAccess",
        "Effect" : "Allow",
        "Action" : "s3:*",
        "Resource" : [
          "arn:aws:s3:::stackref-entity-assets/invitation_lists/*"
        ]
      },
      {
        "Sid" : "SQSAccess",
        "Effect" : "Allow",
        "Action" : [
          "sqs:*"
        ],
        "Resource" : [
          "${aws_sqs_queue.org_invitations.arn}",
          "${aws_sqs_queue.org_invitations_deadletter.arn}",
          "${data.terraform_remote_state.tator.outputs.sqs_queue_arn}"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "shot_clock_lambda" {
  role       = aws_iam_role.shot_clock_lambda.name
  policy_arn = aws_iam_policy.shot_clock_lambda.arn
}

resource "aws_iam_role_policy_attachment" "shot_clock_lambda_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.shot_clock_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role" "shot_clock_scheduler" {
  name = "shot_clock_scheduler-${var.environment}"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : [
            "lambda.amazonaws.com",
            "scheduler.amazonaws.com"
          ]
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_policy" "shot_clock_scheduler" {
  name = "shot_clock_scheduler-${var.environment}"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "lambda:InvokeFunction",
        "Resource" : "${aws_lambda_function.amazon_mkt_meter.arn}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "shot_clock_scheduler" {
  role       = aws_iam_role.shot_clock_scheduler.name
  policy_arn = aws_iam_policy.shot_clock_scheduler.arn
}
