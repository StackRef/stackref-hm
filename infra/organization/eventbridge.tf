resource "aws_cloudwatch_event_bus" "team-account" {
  for_each = { for team_account in aws_organizations_account.stackref-team[*] : team_account.name => team_account }

  name = each.value.name
}

resource "aws_cloudwatch_event_bus_policy" "team-account" {
  for_each = { for team_account in aws_organizations_account.stackref-team[*] : team_account.name => team_account }

  event_bus_name = each.value.name
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowTeamAccountPutEvents",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "${each.value.id}"
        },
        "Action" : "events:PutEvents",
        "Resource" : "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/${each.value.name}"
      },
      {
        "Sid" : "AllowStackrefCoreManage",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "${data.aws_caller_identity.current.account_id}"
        },
        "Action" : [
          "events:PutRule",
          "events:PutTargets",
          "events:DeleteRule",
          "events:RemoveTargets",
          "events:DisableRule",
          "events:EnableRule",
          "events:TagResource",
          "events:UntagResource",
          "events:DescribeRule",
          "events:ListTargetsByRule",
          "events:ListTagsForResource"
        ],
        "Resource" : "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/${each.value.name}",
        "Condition" : {
          "StringEqualsIfExists" : {
            "events:creatorAccount" : "${data.aws_caller_identity.current.account_id}"
          }
        }
      }
    ]
  })
}
