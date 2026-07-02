resource "aws_iam_user" "auth0_email" {
  name = "auth0_email"
  path = "/external_integrations/"
}

resource "aws_iam_user_policy" "auth0_email" {
  name = "PermitSES"
  user = aws_iam_user.auth0_email.name

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendRawEmail",
                "ses:SendEmail"
            ],
            "Resource": "*"
        }
    ]
}
POLICY
}
