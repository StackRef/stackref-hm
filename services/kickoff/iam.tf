resource "aws_iam_role" "kickoff_lambda" {
  name = "kickoff_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "kickoff_lambda" {
  name = "kickoff_lambda"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowLogToCloudWatch",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/kickoff:*",
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/kickoffSQS:*"
      ]
    },
    {
      "Sid": "AllowWSDynamoTableAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DeleteItem",
        "dynamodb:Put*",
        "dynamodb:Get*",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": ["*"]
    },
    {
      "Sid": "SecretsManagerDbCredentialsAccess",
      "Effect": "Allow",
      "Action": [
          "secretsmanager:GetSecretValue"
      ],
      "Resource":[
        "${data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn}"
      ]
    },
    {
      "Sid": "SQSAccess",
      "Effect": "Allow",
      "Action": [
          "sqs:*"
      ],
      "Resource": [
        "${data.terraform_remote_state.tator.outputs.sqs_queue_arn}",
        "${aws_sqs_queue.kickoff.arn}",
        "${aws_sqs_queue.kickoff_deadletter.arn}"
      ]
    },
    {
      "Sid": "AllowAssumeRoleCodescansAccount",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "${var.sr_analysis_codescans_role_arn}"
    },
    {
      "Sid": "AllowS3ResultsBucketRead",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::stackref-team-analysis-results",
        "arn:aws:s3:::stackref-team-analysis-results/*"
      ]
    },
    {
      "Sid": "AllowKMSDecrypt",
      "Effect": "Allow",
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "*"
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
}
POLICY
}

resource "aws_iam_role_policy_attachment" "kickoff_lambda" {
  role       = aws_iam_role.kickoff_lambda.name
  policy_arn = aws_iam_policy.kickoff_lambda.arn
}

resource "aws_iam_role_policy_attachment" "kickoff_lambda_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.kickoff_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role" "kickoff_codescans_codepipeline" {
  name = "kickoff_codescans_codepipeline"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "AWS": "arn:aws:iam::${var.sr_analysis_codescans_account_id}:root"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "kickoff_codescans_pipeline" {
  role       = aws_iam_role.kickoff_codescans_codepipeline.name
  policy_arn = aws_iam_policy.kickoff_lambda.arn
}

resource "aws_iam_role" "kickoff_scheduler" {
  name = "kickoff_scheduler"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "scheduler.amazonaws.com"
        ]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "kickoff_scheduler" {
  name = "kickoff_scheduler"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "${aws_lambda_function.kickoff.arn}"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "kickoff_scheduler" {
  role       = aws_iam_role.kickoff_scheduler.name
  policy_arn = aws_iam_policy.kickoff_scheduler.arn
}
