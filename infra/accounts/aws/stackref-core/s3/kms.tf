resource "aws_kms_key" "entity_assets" {
  for_each = var.entity_asset_buckets

  description             = "Entity asset bucket - ${each.value.environment}"
  deletion_window_in_days = 14

  tags = {
    Name        = "${each.value.environment}-entity-assets"
    environment = each.value.environment
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
        "Sid" : "PermitApiLambda",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "${var.stackref_main_api_lambda_role}"
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
  for_each = var.entity_asset_buckets

  name          = "alias/${each.value.environment}-entity-assets"
  target_key_id = aws_kms_key.entity_assets[each.key].key_id
}
