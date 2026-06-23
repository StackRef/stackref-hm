resource "aws_ssm_patch_group" "stackref_infra" {
  baseline_id = "arn:aws:ssm:us-east-1:000000000000:patchbaseline/pb-0be8c61cde3be63f3"
  patch_group = "stackref_infrastructure"
}

resource "aws_ssm_maintenance_window" "stackref_infra" {
  name              = "stackref_infrastructure"
  description       = "Patch maintenance window for critical StackRef instrastructure"
  schedule          = "cron(00 2 ? * * *)" # Daily @ 2AM
  schedule_timezone = "America/New_York"
  duration          = 3
  cutoff            = 1
}

resource "aws_ssm_maintenance_window_target" "stackref_infra" {
  window_id     = aws_ssm_maintenance_window.stackref_infra.id
  name          = "stackref_infrastructure"
  description   = "Critical StackRef infrastructure"
  resource_type = "INSTANCE"

  targets {
    key    = "tag:stackref:organization_uuid"
    values = ["c2b55dce-c710-4d8e-9ab5-cec08250a5bc"]
  }
}

resource "aws_ssm_maintenance_window_task" "stackref_infra_patching" {
  name            = "PatchingTask"
  description     = "Patching task for critical StackRef infrastructure"
  max_concurrency = 2
  max_errors      = 1
  priority        = 1
  task_arn        = "AWS-RunPatchBaseline"
  task_type       = "RUN_COMMAND"
  window_id       = aws_ssm_maintenance_window.stackref_infra.id

  targets {
    key    = "WindowTargetIds"
    values = [aws_ssm_maintenance_window_target.stackref_infra.id]
  }

  task_invocation_parameters {
    run_command_parameters {
      comment = "Install patches and reboot"
      cloudwatch_config {
        cloudwatch_output_enabled = true
        cloudwatch_log_group_name = aws_cloudwatch_log_group.patch_logs.name
      }
      parameter {
        name   = "RebootOption"
        values = ["RebootIfNeeded"]
      }
    }
  }
}
