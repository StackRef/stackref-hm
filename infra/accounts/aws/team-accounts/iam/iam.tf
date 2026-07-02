resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  password_reuse_prevention      = 24
  max_password_age               = 89
}

resource "aws_iam_group" "team_players" {
  name = "sr_team_players"
  path = "/stackref/team/players/"
}

resource "aws_iam_group" "team_leaders" {
  name = "sr_team_leaders"
  path = "/stackref/team/leaders/"
}

resource "aws_iam_group_policy_attachment" "team_players-ReadOnlyAccess" {
  group      = aws_iam_group.team_players.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_group_policy_attachment" "team_leaders-ReadOnlyAccess" {
  group      = aws_iam_group.team_leaders.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_policy" "SR-TeamPlayers-Standard" {
  name        = "SR-TeamPlayers-Standard"
  description = "Standard policy applied to all team players"
  path        = "/stackref/team/"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Resource" : "*",
        "NotAction": [
          "account:*",
          "activate:*",
          "artifact:*",
          "aws-marketplace-management:*",
          "aws-marketplace:*",
          "aws-portal:*",
          "backup:*",
          "backup-storage:*",
          "budgets:*",
          "ce:*",
          "chime:*",
          "cloudtrail:*",
          "config:*",
          "consolidatedbilling:*",
          "cur:*",
          "directconnect:*",
          "ec2:CreateVpcPeeringConnection",
          "ec2:AcceptVpcPeeringConnection",
          "elasticmapreduce:*",
          "fms:*",
          "globalaccelerator:*",
          "groundstation:*",
          "guardduty:*",
          "iam:CreateAccessKey",
          "iam:CreateLoginProfile",
          "invoicing:*",
          "license-manager:*",
          "organizations:*",
          "payments:*",
          "pricing:*",
          "private-networks:*",
          "purchase-orders:*",
          "redshift:*",
          "rds:PurchaseReservedDBInstancesOffering",
          "sagemaker:*",
          "savingsplans:*",
          "ses:*",
          "shield:*",
          "snowball:*",
          "support:*",
          "tax:*",
          "waf:*",
          "waf-regional:*",
          "wafv2:*",
          "wellarchitected:*",
          "wickr:*",
          "workspaces:*",
          "workmail:*",
          "workdocs:*"
        ]
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "team_players-SR-TeamPlayers-Standard" {
  group      = aws_iam_group.team_players.name
  policy_arn = aws_iam_policy.SR-TeamPlayers-Standard.arn
}

resource "aws_iam_group_policy_attachment" "team_leaders-SR-TeamPlayers-Standard" {
  group      = aws_iam_group.team_leaders.name
  policy_arn = aws_iam_policy.SR-TeamPlayers-Standard.arn
}

resource "aws_iam_role" "coach" {
  name = "sr-coach"
  path = "/stackref/admin/"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : "ec2.amazonaws.com"
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_instance_profile" "coach" {
  name = "sr-coach"
  role = aws_iam_role.coach.name
}

# !!NOTE!! This is obviously temporary
# TODO: Create Coach-specific role policy for only what it needs to be able to do (which is a lot)
resource "aws_iam_role_policy_attachment" "AdministratorAccess" {
  role       = aws_iam_role.coach.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role" "tator_websocket" {
  name = "sr-tator-websocket"
  path = "/stackref/admin/"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "AWS" : [
            "${var.tator_event_bridge_lambda_role_arn}"
          ]
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "tator_websocket_AmazonEC2FullAccess" {
  role       = aws_iam_role.tator_websocket.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}
