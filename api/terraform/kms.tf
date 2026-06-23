#tfsec:ignore:aws-kms-auto-rotate-keys
resource "aws_kms_key" "entity_assets" {
  description             = "Entity asset bucket"
  deletion_window_in_days = 14

  tags = {
    Name = "stackref-entity-assets"
  }

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "EnableIAMUserPermissions",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        "Action" : "kms:*",
        "Resource" : "*"
      },
      {
        "Sid" : "PermitLambda",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : [
            "${aws_iam_role.stackref_main_api.arn}",
            "arn:aws:iam::000000000000:role/shot_clock_lambda-dev"
          ]
        },
        "Action" : [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_kms_alias" "entity_assets" {
  name          = "alias/stackref-entity-assets"
  target_key_id = aws_kms_key.entity_assets.key_id
}
