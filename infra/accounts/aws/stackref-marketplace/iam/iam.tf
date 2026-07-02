resource "aws_iam_role" "stackref_core_lambda" {
  name = "stackref_core_lambda"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "AWS" : "arn:aws:iam::${var.sr_core_account_id}:root"
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })
}

resource "aws_iam_policy" "stackref_core_lambda" {
  name = "stackref_core_lambda"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "MarketplaceAccess",
        "Effect" : "Allow",
        "Action" : [
          "aws-marketplace:*",
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "stackref_core_lambda" {
  role       = aws_iam_role.stackref_core_lambda.name
  policy_arn = aws_iam_policy.stackref_core_lambda.arn
}
