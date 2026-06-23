resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "AWSServiceMonitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "email_jordan" {
  name             = "EMail Jordan"
  frequency        = "DAILY"
  monitor_arn_list = [aws_ce_anomaly_monitor.service_monitor.arn]
  subscriber {
    type    = "EMAIL"
    address = "admin@example.com"
  }
  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["50.0"]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}

resource "aws_ce_anomaly_subscription" "slack" {
  name             = "To Slack"
  frequency        = "IMMEDIATE"
  monitor_arn_list = [aws_ce_anomaly_monitor.service_monitor.arn]
  subscriber {
    type    = "SNS"
    address = aws_sns_topic.slack_alerts.arn
  }
  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["50.0"]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}
