resource "aws_iam_policy" "team_pb" {
  name        = "SR-PB-Team"
  path        = "/stackref/team/"
  description = "Required permission boundary for use in team resource roles"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "*",
        "Resource" : "*",
        "Effect" : "Allow",
        "Condition" : {
          "StringNotEqualsIfExists" : {
            "aws:ResourceTag/stackref:admin" : "true"
          }
        }
      }
    ]
  })
}
