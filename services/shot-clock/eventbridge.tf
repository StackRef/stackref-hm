
resource "aws_scheduler_schedule_group" "shot_clock" {
  name = "shot-clock"
}

resource "aws_scheduler_schedule" "amazon_mkt_meter" {
  name       = "amazon-mkt-meter-${var.environment}"
  group_name = aws_scheduler_schedule_group.shot_clock.name

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(1 hour)"

  target {
    arn      = aws_lambda_function.amazon_mkt_meter.arn
    role_arn = aws_iam_role.shot_clock_scheduler.arn
  }
}
