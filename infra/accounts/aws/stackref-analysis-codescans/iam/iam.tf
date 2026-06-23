resource "aws_iam_role" "stackref_core_lambda" {
  name = "stackref_core_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "AWS": "arn:aws:iam::${var.sr_core_account_id}:root"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "stackref_core_lambda" {
  name = "stackref_core_lambda"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
      {
        "Sid": "IAMAccesss",
        "Effect": "Allow",
        "Action": "iam:*",
        "Resource": "*"
      },
      {
        "Sid": "CodeCommitBuildAccess",
        "Effect": "Allow",
        "Action": [
            "codebuild:*",
            "codecommit:*",
            "codepipeline:*"
        ],
        "Resource": "*"
      }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "stackref_core_lambda" {
  role       = aws_iam_role.stackref_core_lambda.name
  policy_arn = aws_iam_policy.stackref_core_lambda.arn
}

resource "aws_iam_role" "codescans_codebuild" {
  name = "stackref_codescans_codebuild"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "codebuild.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
}

resource "aws_iam_policy" "codescans_codebuild" {
  name = "stackref_codescans_codebuild"

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*",
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*:*",
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/stackref/analysis/codescans:log-stream:*"
            ],
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ]
        },
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:s3:::codepipeline-${var.aws_region}-*",
                "arn:aws:s3:::stackref-acme-team-analysis-results",
                "arn:aws:s3:::stackref-acme-team-analysis-results/*"
            ],
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketAcl",
                "s3:GetBucketLocation"
            ]
        },
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:kms:us-east-1:000000000000:key/64f0b2be-ff9d-4499-9bf6-13fb750fc264"
            ],
            "Action": [
                "kms:*"
            ]
        },
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:codecommit:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
            ],
            "Action": [
                "codecommit:GitPull"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "codebuild:CreateReportGroup",
                "codebuild:CreateReport",
                "codebuild:UpdateReport",
                "codebuild:BatchPutTestCases",
                "codebuild:BatchPutCodeCoverages"
            ],
            "Resource": [
                "arn:aws:codebuild:${var.aws_region}:${data.aws_caller_identity.current.account_id}:report-group/codescan_team_*"
            ]
        },
        {
            "Sid": "AllowReadParameterStore",
            "Effect": "Allow",
            "Action": [
                "ssm:GetParametersByPath",
                "ssm:GetParameters"
            ],
            "Resource": [
                "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/integrations/snyk/*",
                "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/integrations/infracost/*",
                "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/integrations/cody/*",
                "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/integrations/openai/*"
            ]
        },
        {
            "Sid": "AllowECRAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:*"
            ],
            "Resource": ["*"]
        }
    ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "codescans_codebuild" {
  role       = aws_iam_role.codescans_codebuild.name
  policy_arn = aws_iam_policy.codescans_codebuild.arn
}

resource "aws_iam_role" "codepipeline" {
  name = "stackref_codepipeline"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "codepipeline.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
}

resource "aws_iam_policy" "codepipeline" {
  name = "stackref_codepipeline"

  policy = <<POLICY
{
    "Statement": [
        {
            "Action": [
                "codecommit:CancelUploadArchive",
                "codecommit:GetBranch",
                "codecommit:GetCommit",
                "codecommit:GetRepository",
                "codecommit:GetUploadArchiveStatus",
                "codecommit:UploadArchive"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "codedeploy:CreateDeployment",
                "codedeploy:GetApplication",
                "codedeploy:GetApplicationRevision",
                "codedeploy:GetDeployment",
                "codedeploy:GetDeploymentConfig",
                "codedeploy:RegisterApplicationRevision"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "cloudwatch:*",
                "kms:*",
                "s3:*"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "lambda:InvokeFunction",
                "lambda:ListFunctions"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "codebuild:BatchGetBuilds",
                "codebuild:StartBuild",
                "codebuild:BatchGetBuildBatches",
                "codebuild:StartBuildBatch"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::000000000000:role/kickoff_codescans_codepipeline"
        }
    ],
    "Version": "2012-10-17"
}
POLICY
}

resource "aws_iam_role_policy_attachment" "stackref_codepipeline" {
  role       = aws_iam_role.codepipeline.name
  policy_arn = aws_iam_policy.codepipeline.arn
}
