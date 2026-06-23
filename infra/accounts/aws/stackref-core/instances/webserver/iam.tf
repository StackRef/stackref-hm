resource "aws_iam_role" "webserver" {
  name_prefix        = "webserver-${var.environment}-"
  description        = "Web Server - ${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.webserver.json
}

resource "aws_iam_role_policy_attachment" "AmazonEC2RoleforSSM" {
  role       = aws_iam_role.webserver.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

resource "aws_iam_role_policy_attachment" "CloudWatchAgentServerPolicy" {
  role       = aws_iam_role.webserver.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}


resource "aws_iam_instance_profile" "webserver" {
  name_prefix = "webserver-${var.environment}-"
  role        = aws_iam_role.webserver.name
}

data "aws_iam_policy_document" "webserver" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"

      identifiers = [
        "ec2.amazonaws.com",
      ]
    }
  }
}
