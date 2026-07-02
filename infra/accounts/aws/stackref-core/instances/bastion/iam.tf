resource "aws_iam_role" "bastion" {
  name_prefix        = "bastion-${var.environment}-"
  description        = "Bastion - ${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.bastion.json
}

resource "aws_iam_role_policy_attachment" "AmazonEC2RoleforSSM" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

resource "aws_iam_role_policy_attachment" "CloudWatchAgentServerPolicy" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "AmazonEC2ContainerRegistryFullAccess" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

resource "aws_iam_instance_profile" "bastion" {
  name_prefix = "bastion-${var.environment}-"
  role        = aws_iam_role.bastion.name
}

data "aws_iam_policy_document" "bastion" {
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

# resource "aws_iam_policy" "bastion_route53" {
#   name_prefix = "bastion-${var.environment}-"
#   path        = "/"
#   description = "Permissions for bastion to update its Route53 record"

#   policy = <<POLICY
# {
#     "Version": "2012-10-17",
#     "Statement": [
#         {
#             "Sid": "AccessToRoute53Zone",
#             "Effect": "Allow",
#             "Action": [
#                 "route53:GetHostedZone",
#                 "route53:ChangeResourceRecordSets"
#             ],
#             "Resource": "arn:aws:route53:::hostedzone/${data.terraform_remote_state.route53.outputs.stackref_com_zone_id}"
#         },
#         {
#             "Sid": "ListRoute53Zones",
#             "Effect": "Allow",
#             "Action": "route53:ListHostedZones",
#             "Resource": "*"
#         }
#     ]
# }
# POLICY
# }

# resource "aws_iam_role_policy_attachment" "bastion_route53" {
#   role       = aws_iam_role.bastion.name
#   policy_arn = aws_iam_policy.bastion_route53.arn
# }
