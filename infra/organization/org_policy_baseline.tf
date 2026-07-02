resource "aws_organizations_policy" "baseline_deny_1" {
  name        = "BaselineDeny1"
  description = "Baseline denied services and resources for teams"

  content = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Deny",
        "NotAction" : [
          "a4b:*",
          "acm:*",
          "cloudfront:*",
          "ec2:DescribeRegions",
          "ec2:DescribeTransitGateways",
          "ec2:DescribeVpnGateways",
          "fms:*",
          "health:*",
          "iam:*",
          "importexport:*",
          "kms:*",
          "mobileanalytics:*",
          "networkmanager:*",
          "route53:*",
          "route53domains:*",
          "s3:GetAccountPublic*",
          "s3:ListAllMyBuckets",
          "s3:PutAccountPublic*",
          "sts:*",
          "trustedadvisor:*"
        ],
        "Resource" : "*",
        "Condition" : {
          "StringNotEquals" : {
            "aws:RequestedRegion" : [
              "us-east-1"
            ]
          },
          "ArnNotLike" : {
            "aws:PrincipalARN" : [
              "arn:aws:iam::*:role/CrossAccountAdmin",
              "arn:aws:iam::*:role/OrganizationAccountAccessRole",
              "arn:aws:iam::*:role/stackref/admin/sr-tator-websocket",
              "arn:aws:iam::000000000000:role/tator_event_bridge_lambda"
            ]
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "account:*",
          "activate:*",
          "artifact:*",
          "aws-marketplace-management:*",
          "aws-marketplace:*",
          "aws-portal:*",
          "backup:*",
          "backup-storage:*",
          "budgets:*",
          "ce:*",
          "chime:*",
          "cloudtrail:*",
          "config:*",
          "consolidatedbilling:*",
          "cur:*",
          "directconnect:*",
          "ec2:CreateVpcPeeringConnection",
          "ec2:AcceptVpcPeeringConnection",
          "elasticmapreduce:*",
          "fms:*",
          "globalaccelerator:*",
          "groundstation:*",
          "guardduty:*",
          "iam:CreateAccessKey",
          "iam:CreateLoginProfile",
          "invoicing:*",
          "license-manager:*",
          "organizations:*",
          "payments:*",
          "pricing:*",
          "private-networks:*",
          "purchase-orders:*",
          "redshift:*",
          "rds:PurchaseReservedDBInstancesOffering",
          "sagemaker:*",
          "savingsplans:*",
          "ses:*",
          "shield:*",
          "snowball:*",
          "support:*",
          "tax:*",
          "waf:*",
          "waf-regional:*",
          "wafv2:*",
          "wellarchitected:*",
          "wickr:*",
          "workspaces:*",
          "workmail:*",
          "workdocs:*"
        ],
        "Resource" : "*",
        "Condition" : {
          "ArnNotLike" : {
            "aws:PrincipalARN" : [
              "arn:aws:iam::*:role/CrossAccountAdmin",
              "arn:aws:iam::*:role/OrganizationAccountAccessRole",
              "arn:aws:iam::*:role/stackref/admin/sr-tator-websocket",
              "arn:aws:iam::000000000000:role/tator_event_bridge_lambda"
            ]
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "ram:CreateResourceShare",
          "ram:UpdateResourceShare"
        ],
        "Resource" : "*",
        "Condition" : {
          "Bool" : {
            "ram:RequestedAllowsExternalPrincipals" : "true"
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "organizations:LeaveOrganization"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_organizations_policy" "baseline_deny_2" {
  name        = "BaselineDeny2"
  description = "Baseline denied services and resources for teams"

  content = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "DenyChangesToCrossAccountAdminRole",
        "Effect" : "Deny",
        "NotAction" : [
          "iam:GetContextKeysForPrincipalPolicy",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "iam:ListRolePolicies",
          "iam:ListRoleTags"
        ],
        "Resource" : [
          "arn:aws:iam::*:role/CrossAccountAdmin"
        ],
        "Condition" : {
          "StringNotLike" : {
            "aws:PrincipalARN" : [
              "arn:aws:iam::*:role/CrossAccountAdmin",
              "arn:aws:iam::*:role/OrganizationAccountAccessRole"
            ]
          }
        }
      },
      {
        "Sid" : "DenyAccessToStackRefAdminTagged",
        "Effect" : "Deny",
        "Resource" : "*",
        "Action" : "*",
        "Condition" : {
          "StringEqualsIgnoreCase" : {
            "aws:ResourceTag/stackref:admin" : "true"
          },
          "StringNotLike" : {
            "aws:PrincipalARN" : [
              "arn:aws:iam::*:role/CrossAccountAdmin",
              "arn:aws:iam::*:role/OrganizationAccountAccessRole",
              "arn:aws:iam::*:role/stackref/admin/sr-tator-websocket",
              "arn:aws:iam::000000000000:role/tator_event_bridge_lambda"
            ]
          }
        }
      }
    ]
  })
}
