resource "aws_iam_service_linked_role" "aws_config" {
  aws_service_name = "config.amazonaws.com"
}

resource "aws_iam_role" "umpire_lambda" {
  name = "umpire_lambda"

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

resource "aws_iam_policy" "umpire_lambda" {
  name = "umpire_lambda"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/Umpire:*"
        ]
      },
      {
        "Effect" : "Allow",
        "Action" : "lambda:InvokeFunction",
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "umpire_lambda" {
  role       = aws_iam_role.umpire_lambda.name
  policy_arn = aws_iam_policy.umpire_lambda.arn
}

resource "aws_iam_role_policy_attachment" "lambda_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.umpire_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
