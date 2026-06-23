resource "aws_ecr_repository" "stackref" {
  for_each = var.stackref_repos

  name                 = "${each.value.namespace}/${each.value.name}"
  image_tag_mutability = each.value.mutable ? "MUTABLE" : "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

}

resource "aws_ecr_repository_policy" "stackref" {
  for_each = var.stackref_repos

  repository = aws_ecr_repository.stackref[each.value.name].name

  policy = <<EOF
{
    "Version": "2008-10-17",
    "Statement": [
      {
        "Sid": "StackRefECRAccessPolicy",
        "Effect": "Allow",
        "Principal": "*",
        "Action": [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchDeleteImage",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:DeleteRepository",
          "ecr:DeleteRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:SetRepositoryPolicy",
          "ecr:UploadLayerPart"
        ]
      }
    ]
}
EOF
}

resource "aws_ecr_lifecycle_policy" "stackref" {
  for_each = var.stackref_repos

  repository = aws_ecr_repository.stackref[each.value.name].name

  policy = <<EOF
{
    "rules": [
        {
            "rulePriority": 10,
            "description": "Expire untagged images older than 14 days",
            "selection": {
                "tagStatus": "untagged",
                "countType": "sinceImagePushed",
                "countUnit": "days",
                "countNumber": 14
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 20,
            "description": "Keep last 10 latest images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["latest"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 30,
            "description": "Keep last 10 qa images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["qa"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 50,
            "description": "Keep last 10 staging images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["staging"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 60,
            "description": "Keep last 10 prod images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["prod"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF
}
