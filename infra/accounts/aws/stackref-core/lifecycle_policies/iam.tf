resource "aws_iam_role" "dlm_lifecycle" {
  name               = "dlm_lifecycle"
  description        = "For Digital Lifecycle Management actions"
  assume_role_policy = data.aws_iam_policy_document.dlm_lifecycle.json
}

data "aws_iam_policy_document" "dlm_lifecycle" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "dlm_lifecycle" {
  name_prefix   = "dlm_lifecycle-"
  policy = <<POLICY
{
 "Version": "2012-10-17",
 "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSnapshot",
        "ec2:CreateSnapshots",
        "ec2:DeleteSnapshot",
        "ec2:DescribeInstances",
        "ec2:DescribeVolumes",
        "ec2:DescribeSnapshots"
       ],
       "Resource": "*"
    },
    {
       "Effect": "Allow",
       "Action": [
          "ec2:CreateTags"
       ],
       "Resource": "arn:aws:ec2:*::snapshot/*"
    }
 ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "dlm_lifecycle" {
  role       = aws_iam_role.dlm_lifecycle.name
  policy_arn = aws_iam_policy.dlm_lifecycle.arn
}
