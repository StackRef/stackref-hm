data "aws_iam_policy_document" "snyk-iam-policy-document" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::000000000000:role/snyk-generate-credentials"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = ["YOUR_SNYK_CLOUD_EXTERNAL_ID"]
    }
  }
}

resource "aws_iam_role" "snyk-iam-role" {
  name               = "snyk-cloud-role"
  assume_role_policy = data.aws_iam_policy_document.snyk-iam-policy-document.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/SecurityAudit"
  ]

  inline_policy {
    name = "Snyk"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect   = "Allow"
          Resource = "*"
          Action = [
            "apigateway:GET",
            "cloudwatch:GetDashboard",
            "cloudwatch:ListDashboards",
            "cloudwatch:ListTagsForResource",
            "cognito-idp:DescribeIdentityProvider",
            "cognito-idp:DescribeResourceServer",
            "cognito-idp:DescribeUserPool",
            "cognito-idp:DescribeUserPoolClient",
            "cognito-idp:DescribeUserPoolDomain",
            "cognito-idp:GetGroup",
            "cognito-idp:GetUserPoolMfaConfig",
            "cognito-idp:ListGroups",
            "cognito-idp:ListIdentityProviders",
            "cognito-idp:ListResourceServers",
            "cognito-idp:ListUserPoolClients",
            "dynamodb:ListTagsOfResource",
            "ecr:ListTagsForResource",
            "elasticache:ListTagsForResource",
            "elasticfilesystem:DescribeLifecycleConfiguration",
            "elasticfilesystem:DescribeTags",
            "glacier:GetVaultNotifications",
            "glacier:ListTagsForVault",
            "kinesis:DescribeStreamSummary",
            "lambda:GetAlias",
            "lambda:GetEventSourceMapping",
            "lambda:GetFunction",
            "macie:ListMemberAccounts",
            "macie:ListS3Resources",
            "mediastore:DescribeContainer",
            "mediastore:ListTagsForResource",
            "sns:GetSubscriptionAttributes",
            "sns:ListSubscriptions",
            "sns:ListTagsForResource",
            "states:DescribeStateMachine",
            "states:ListTagsForResource",
            "waf-regional:Get*",
            "waf-regional:List*",
            "waf:Get*",
            "waf:List*",
            "wafv2:Get*",
            "wafv2:List*"
          ]
        },
      ]
    })
  }
}

