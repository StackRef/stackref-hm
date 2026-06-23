resource "aws_codebuild_project" "sr_team_codescan_scc" {
  name          = "sr_team_codescan_scc"
  description   = "Runs SCC code analysis on Event Team's provided code"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/stackref/cossell:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          build:
              commands:
                  - touch /tmp/scc-output.json
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      /usr/local/bin/scc --format-multi tabular:stdout,json:/tmp/scc-output.json
                    fi
      artifacts:
          files:
              - /tmp/scc-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }

  #  vpc_config {
  #    vpc_id = aws_vpc.example.id

  #    subnets = [
  #      aws_subnet.example1.id,
  #      aws_subnet.example2.id,
  #    ]

  #    security_group_ids = [
  #      aws_security_group.example1.id,
  #      aws_security_group.example2.id,
  #    ]
  #  }
}

resource "aws_codebuild_project" "sr_team_codescan_snyk" {
  name          = "sr_team_codescan_snyk"
  description   = "Runs Snyk code analysis on Event Team's provided code"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/stackref/cossell:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"

    environment_variable {
      name  = "SNYK_TOKEN"
      value = "/integrations/snyk/api_token"
      type  = "PARAMETER_STORE"
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          build:
              commands:
                  - touch /tmp/snyk-output.json
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      if [[ ! $(snyk code test --json | grep "NoSupportedSastFiles") ]]; then
                        snyk code test --json 2>/dev/null | tee /tmp/snyk-output.json;
                      fi
                    fi
      artifacts:
          files:
              - /tmp/snyk-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }

  #  vpc_config {
  #    vpc_id = aws_vpc.example.id

  #    subnets = [
  #      aws_subnet.example1.id,
  #      aws_subnet.example2.id,
  #    ]

  #    security_group_ids = [
  #      aws_security_group.example1.id,
  #      aws_security_group.example2.id,
  #    ]
  #  }
}

resource "aws_codebuild_project" "sr_team_codescan_codeclimate" {
  name          = "sr_team_codescan_codeclimate"
  description   = "Runs CodeClimate code analysis on Event Team's provided code"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:6.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          pre_build:
              commands:
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com
                      docker pull ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate:latest
                      docker tag ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate:latest codeclimate/codeclimate:latest
                      docker pull ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate-structure:latest
                      docker tag ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate-structure:latest codeclimate/codeclimate-structure:latest
                      docker pull ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate-duplication:latest
                      docker tag ${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/community/codeclimate/codeclimate-duplication:latest codeclimate/codeclimate-duplication:latest
                    fi
          build:
              commands:
                  - touch /tmp/codeclimate-output.json
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      docker run --rm -e CODECLIMATE_CODE="$PWD" -v "$PWD":/code -v /var/run/docker.sock:/var/run/docker.sock -v /tmp/cc:/tmp/cc codeclimate/codeclimate:latest analyze -f json | tee /tmp/codeclimate-output.json
                    fi
      artifacts:
          files:
              - /tmp/codeclimate-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }
}

resource "aws_codebuild_project" "sr_team_codescan_infracost" {
  name          = "sr_team_codescan_infracost"
  description   = "Runs Infracost code analysis on Event Team's provided code"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/stackref/cossell:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"

    environment_variable {
      name  = "INFRACOST_API_KEY"
      value = "/integrations/infracost/api_key"
      type  = "PARAMETER_STORE"
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          build:
              commands:
                  - touch /tmp/infracost-output.json
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      /usr/local/bin/infracost breakdown --path . --include-all-paths --format json --out-file /tmp/infracost-output.json
                    fi
      artifacts:
          files:
              - /tmp/infracost-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }
}

resource "aws_codebuild_project" "sr_team_codescan_cossell" {
  name          = "sr_team_codescan_cossell"
  description   = "Runs Cossell AI code analysis on Event Team's provided code"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/stackref/cossell:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"

    environment_variable {
      name  = "AI_API_URL"
      value = "/integrations/cody/api_url"
      type  = "PARAMETER_STORE"
    }

    environment_variable {
      name  = "AI_API_TOKEN"
      value = "/integrations/cody/api_token"
      type  = "PARAMETER_STORE"
    }

environment_variable {
      name  = "OPENAI_API_KEY"
      value = "/integrations/openai/api_key"
      type  = "PARAMETER_STORE"
    }

  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          build:
              commands:
                  - touch /tmp/cossell-output.json
                  - |
                    if [ $(git rev-list --count main) -eq 1 ]; then
                      echo ":: Initial commit -- not scanning."
                    else
                      /usr/local/bin/cossell.py .
                    fi
      artifacts:
          files:
              - /tmp/cossell-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }
}

resource "aws_codebuild_project" "sr_team_codescan_lighthouse" {
  name          = "sr_team_codescan_lh"
  description   = "Runs Unlighthouse endpoint analysis on Event Team's provided demo site"
  build_timeout = "15"
  service_role  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/stackref_codescans_codebuild"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${var.sr_core_account_id}.dkr.ecr.us-east-1.amazonaws.com/stackref/cossell:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/stackref/analysis/codescans"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-EOF
      version: 0.2
      phases:
          build:
              commands:
                  - touch /tmp/lh-output.json
                  - |
                    if [ ! -z $SR_TEAM_DEMO_URL ]; then
                      unlighthouse-ci --site $SR_TEAM_DEMO_URL --budget 100 --output-path /tmp/lh
                    fi
                  - |
                    if [ -e /tmp/lh/lighthouse.json ]; then
                      cat /tmp/lh/lighthouse.json | jq --arg arr_name "unlighthouse" '{"\($arr_name)": [.categories[] | {id: .id, score: .score}]}' > /tmp/lh-output.json
                    fi
      artifacts:
          files:
              - /tmp/lh-output.json
          name: $(date +%Y-%m-%d)
          discard-paths: yes
EOF
  }
}
