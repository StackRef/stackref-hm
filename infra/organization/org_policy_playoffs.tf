resource "aws_organizations_policy" "playoffs" {
  name        = "Playoffs"
  description = "Services and resources allowed in Playoffs package"

  tags = {
    team_package = "playoffs"
  }

  content = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Deny",
        "Action" : [
          "ec2:RunScheduledInstances",
          "ec2:RunInstances"
        ],
        "Resource" : "arn:aws:ec2:*:*:instance/*",
        "Condition" : {
          "StringNotLike" : {
            "ec2:InstanceType" : [
              "a1.medium",
              "t2.nano",
              "t2.micro",
              "t2.small",
              "t2.medium",
              "t3.nano",
              "t3.micro",
              "t3.small",
              "t3.medium",
              "t3a.nano",
              "t3a.micro",
              "t3a.small",
              "t3a.medium",
              "t4g.nano",
              "t4g.micro",
              "t4g.small",
              "t4g.medium"
            ]
          },
          "StringNotEquals" : {
            "ec2:Tenancy" : [
              "default"
            ]
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "ec2:*"
        ],
        "Resource" : [
          "arn:aws:ec2:*:*:elastic-gpu/*"
        ]
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "rds:CreateDBInstance",
          "rds:ModifyDBInstance"
        ],
        "Resource" : "arn:aws:rds:*:*:db:*",
        "Condition" : {
          "StringNotLike" : {
            "rds:DatabaseClass" : [
              "db.t2.micro",
              "db.t2.small",
              "db.t2.medium",
              "db.t3.micro",
              "db.t3.small",
              "db.t3.medium",
              "db.t4g.micro",
              "db.t4g.small",
              "db.t4g.medium"
            ]
          },
          "NumericGreaterThan" : {
            "rds:StorageSize" : [
              "1024"
            ]
          },
          "NumericNotEquals" : {
            "rds:Piops" : [
              "0"
            ]
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "ec2:CreateVolume"
        ],
        "Resource" : [
          "arn:aws:ec2:*:*:volume/*"
        ],
        "Condition" : {
          "StringNotEquals" : {
            "ec2:VolumeType" : [
              "gp2",
              "gp3",
              "standard"
            ]
          },
          "NumericGreaterThan" : {
            "ec2:VolumeIops" : "4000",
            "ec2:VolumeSize" : "100"
          }
        }
      },
      {
        "Effect" : "Deny",
        "Action" : [
          "elasticache:CreateCacheCluster",
          "elasticache:CreateReplicationGroup"
        ],
        "Resource" : [
          "arn:aws:elasticache:*:*:cluster:*",
          "arn:aws:elasticache:*:*:replicationgroup:*"
        ],
        "Condition" : {
          "StringNotLike" : {
            "elasticache:CacheNodeType" : [
              "cache.t2.micro",
              "cache.t2.small",
              "cache.t2.medium",
              "cache.t3.micro",
              "cache.t3.small",
              "cache.t3.medium",
              "cache.t4g.micro",
              "cache.t4g.small",
              "cache.t4g.medium"
            ]
          },
          "NumericGreaterThan" : {
            "elasticache:NumNodeGroups" : "1"
          }
        }
      },
    ]
  })
}
