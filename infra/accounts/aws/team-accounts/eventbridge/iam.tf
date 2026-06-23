resource "aws_iam_role" "event_bus_invoke_remote_team_event_bus" {
  name               = "event-bus-invoke-stackref-core-event-bus"
  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
POLICY
}

data "aws_iam_policy_document" "event_bus_invoke_remote_team_event_bus" {
  statement {
    effect    = "Allow"
    actions   = ["events:PutEvents"]
    resources = ["arn:aws:events:${var.aws_region}:${var.org_account_number}:event-bus/${var.team_account_name}"]
  }
}

resource "aws_iam_policy" "event_bus_invoke_remote_team_event_bus" {
  name   = "event_bus_invoke_remote_team_event_bus"
  policy = data.aws_iam_policy_document.event_bus_invoke_remote_team_event_bus.json
}

resource "aws_iam_role_policy_attachment" "event_bus_invoke_remote_team_event_bus" {
  role       = aws_iam_role.event_bus_invoke_remote_team_event_bus.name
  policy_arn = aws_iam_policy.event_bus_invoke_remote_team_event_bus.arn
}
